import { Construct } from "constructs";
import {
  Duration,
  RemovalPolicy,
  aws_cognito as cognito,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as cloudfront_origins,
  aws_dynamodb as dynamodb,
  aws_lambda as lambda,
  aws_stepfunctions as stepfunctions,
  aws_stepfunctions_tasks as stepfunctions_tasks,
  aws_s3 as s3,
  aws_s3_notifications as s3_notifications
} from "aws-cdk-lib";
import { makeNodejsLambda } from "./make-defaults";

interface JongleurAudioConstructProps {
  userPool: cognito.UserPool;
  userPoolClient: cognito.UserPoolClient;
  practiceTable: dynamodb.Table;
  region: string;
}

/**
 * Infrastructure for Jongleur audio processing and upload. This construct handles
 * upload, storage, logic, processing, and data synthesis relating to audio.
 */
export class JongleurAudioConstruct extends Construct {
  private _audioServeDistribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: JongleurAudioConstructProps) {
    super(scope, id);

    // ------------------------------------------------------------------------
    // Upload.
    // ------------------------------------------------------------------------

    // The main approach to audio upload -
    //   rather than proxy big audio files through our own back end,
    //   we'll allow the front end to upload directly to a protected
    //   S3 bucket and our processing will run on an object trigger.

    // So although it kills me to not run uploads through a lambda,
    // this is actually the one case in Jongleur where a direct
    // front end connection (let the user send their huge file over
    // the network themself) is a GOOD idea.

    // Based on
    //  https://aws.amazon.com/blogs/compute/uploading-to-amazon-s3-directly-from-a-web-or-mobile-application/
    //  https://github.com/aws-samples/amazon-s3-presigned-urls-aws-sam
    // but adapted for CDK, we'll make this a two-step process:
    //   Front end requests a presigned S3 URL (auth'd by our own Cognito
    //     user pool!)
    //   Front end uses the presigned URL to make the upload.
    // Then we'll process the upload in our back end, computing the relevant
    // data and slicing up the file for CDN caching and front-end playback!

    // The bucket in which to ingest client audio uploads.
    const clientAudioUploadBucket = new s3.Bucket(this, "ClientAudioUploadBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [{
        expiration: Duration.days(6),
      }],

      // Remember that this bucket is for ephemeral storage so we shouldn't feel
      // the need to hold on to its contents.
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // The lambda to generate presigned S3 URLs for the client.
    const createUploadSignedUrlLambda = makeNodejsLambda(this, "CreateUploadSignedUrlLambda", {
      entry: "audio/upload/create-upload-signed-url.ts",
      description: "Jongleur - generate presigned S3 URLs for client audio upload.",

      timeout: Duration.seconds(3),

      environment: {
        JONG_S3_REGION: props.region,
        JONG_CLIENT_AUDIO_UPLOAD_BUCKET: clientAudioUploadBucket.bucketName,
        JONG_USER_POOL_ID: props.userPool.userPoolId,
        JONG_USER_POOL_CLIENT_ID: props.userPoolClient.userPoolClientId,
      },
    });
    clientAudioUploadBucket.grantWrite(createUploadSignedUrlLambda);

    // ------------------------------------------------------------------------
    // Process.
    // ------------------------------------------------------------------------

    // The lambda which processes client audio uploads. This one is actually
    // Python instead of NodeJS because of its audio processing libraries.
    // But since librosa is too large to load into a normal Python lambda, we
    // make our own Docker lambda from a Python-based image.
    const processAudioLambda = new lambda.DockerImageFunction(this, "ProcessAudioLambda", {
      description: "Jongleur - process an audio file.",
      code: lambda.DockerImageCode.fromImageAsset("audio/process/"),
      timeout: Duration.minutes(8),
      tracing: lambda.Tracing.ACTIVE,
    });

    // We use a StepFunction to do the processing since there are a few steps
    // involved and I am willing to bet that the core processing will fail
    // every once in a while. Also, the processing might take a long time and
    // we want the client to know where in the process we are at to give a
    // great UX. StepFunction allows us to manage this complexity
    // and fail in a nice way if necessary.

    // Record that processing is taking place.
    const recordBeforeStep = new stepfunctions_tasks.DynamoPutItem(this, "RecordBeforeStep", {
      table: props.practiceTable,
      comment: "Record that we are processing this audio upload.",
      item: {
        id: stepfunctions_tasks.DynamoAttributeValue.fromString(stepfunctions.JsonPath.stringAt("$.uuid")),
        // There's an open bug (https://github.com/aws/aws-cdk/issues/12456) hence the string -> number workaround.
        requestEpoch: stepfunctions_tasks.DynamoAttributeValue.numberFromString(stepfunctions.JsonPath.stringAt("$.requestEpoch")),
        executionArn: stepfunctions_tasks.DynamoAttributeValue.fromString(stepfunctions.JsonPath.stringAt("$$.Execution.Id")),
        currentStatus: stepfunctions_tasks.DynamoAttributeValue.fromString("processing"),
      },
      // Make just this state's input pass into the output.
      resultPath: stepfunctions.JsonPath.DISCARD,
    });

    // Record that we are done processing with success.
    const recordAfterSuccessStep = new stepfunctions_tasks.DynamoUpdateItem(this, "RecordAfterSuccessStep", {
      table: props.practiceTable,
      comment: "Record the successful audio upload.",
      key: {
        id: stepfunctions_tasks.DynamoAttributeValue.fromString(stepfunctions.JsonPath.stringAt("$.uuid")),
      },
      updateExpression: "SET currentStatus = :newStatus",
      expressionAttributeValues: {
        ":newStatus": stepfunctions_tasks.DynamoAttributeValue.fromString("succeeded"),
      },
      // Make just this state's input pass into the output.
      resultPath: stepfunctions.JsonPath.DISCARD,
    });

    // Record that we are done processing with an error.
    const recordAfterFailureStep = new stepfunctions_tasks.DynamoUpdateItem(this, "RecordAfterFailureStep", {
      table: props.practiceTable,
      comment: "Record the failed audio upload.",
      key: {
        id: stepfunctions_tasks.DynamoAttributeValue.fromString(stepfunctions.JsonPath.stringAt("$.uuid")),
      },
      updateExpression: "SET currentStatus = :newStatus",
      expressionAttributeValues: {
        ":newStatus": stepfunctions_tasks.DynamoAttributeValue.fromString("failed"),
      },
      // Make just this state's input pass into the output.
      resultPath: stepfunctions.JsonPath.DISCARD,
    });

    // Process the audio itself.
    const processStep = new stepfunctions_tasks.LambdaInvoke(this, "ProcessStep", {
      lambdaFunction: processAudioLambda,
      // Make just this state's input pass into the output.
      resultPath: stepfunctions.JsonPath.DISCARD,
    });

    // Process an audio upload as a multi-step machine.
    const processAudioUploadStateMachine = new stepfunctions.StateMachine(this, "ProcessAudioUploadStateMachine", {
      // Standard state machine type for sporadic and long running executions.
      stateMachineType: stepfunctions.StateMachineType.STANDARD,

      // The actual state machine steps. Record, process, record.
      definition: stepfunctions.Chain
        .start(recordBeforeStep)
        .next(processStep.next(recordAfterSuccessStep)
          .toSingleState("MainProcessStep", {
            resultPath: stepfunctions.JsonPath.DISCARD,
          })
          // Error handling. Catch the error and report a failure.
          .addCatch(recordAfterFailureStep, {
            resultPath: stepfunctions.JsonPath.DISCARD,
          })
        ),

      timeout: Duration.minutes(15),
      tracingEnabled: true,
    });

    // S3 can't directly trigger a StepFunction so we'll create a very small lambda
    // to bridge the gap. This is a little bit annoying but is probably simpler
    // than using EventBridge to make the connection.
    const callStepFunctionLambda = makeNodejsLambda(this, "CallStepFunctionLambda", {
      entry: "audio/lambda-to-stepfunction.ts",
      description: "Jongleur - call step function from S3 notification.",
      timeout: Duration.seconds(3),
      environment: {
        JONG_STATEMACHINE_ARN: processAudioUploadStateMachine.stateMachineArn,
        JONG_STEPFUNCTIONS_REGION: props.region,
      },
    });
    processAudioUploadStateMachine.grantStartExecution(callStepFunctionLambda);

    // Notify the processing lambda when an upload has completed.
    clientAudioUploadBucket.addObjectCreatedNotification(
      new s3_notifications.LambdaDestination(callStepFunctionLambda)
    );

    // ------------------------------------------------------------------------
    // Serve.
    // ------------------------------------------------------------------------

    // The bucket in which to store audio slices long-term. We won't allow users
    // to pull from this bucket directly. Rather, a cloudfront distribution
    // will serve its contents.
    const audioStorageBucket = new s3.Bucket(this, "AudioStorageBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    this._audioServeDistribution = new cloudfront.Distribution(this, "AudioServeDistribution", {
      defaultBehavior: {
        // Cloudfront will automatically grant itself access to the bucket.
        origin: new cloudfront_origins.S3Origin(audioStorageBucket),
        // We don't allow any HTTP requests to this distribution. Our front-end
        // will always use HTTPS.
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
      },
      comment: "Serves and caches Jongleur user audio files.",
      httpVersion: cloudfront.HttpVersion.HTTP2,
      enabled: true,
      // Using the cheapest price class for now while developing, but can switch
      // to PRICE_CLASS_ALL later.
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });
  }

  get audioServeDistribution() {
    return this._audioServeDistribution;
  }
}
