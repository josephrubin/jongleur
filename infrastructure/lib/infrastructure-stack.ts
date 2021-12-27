import * as cdk from "@aws-cdk/core";
import * as appsync from "@aws-cdk/aws-appsync";
import * as cognito from "@aws-cdk/aws-cognito";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as lambda from "@aws-cdk/aws-lambda";
import * as nodelambda from "@aws-cdk/aws-lambda-nodejs";
import * as iam from "@aws-cdk/aws-iam";
import * as apprunner from "@aws-cdk/aws-apprunner";
import { Duration } from "@aws-cdk/core";
import { DockerImageAsset } from "@aws-cdk/aws-ecr-assets";

interface InfrastructureStackProps extends cdk.StackProps {
  // Path to the file that contains the graphql schema for our API.
  readonly graphqlSchemaFile: string;
}

const QUERY_TYPE = "Query";
const MUTATION_TYPE = "Mutation";

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: InfrastructureStackProps) {
    super(scope, id, props);

    // The user pool for our app's auth.
    const userPool = new cognito.UserPool(this, "JongleurUserPool", {
      selfSignUpEnabled: true,
      userVerification: {
        emailSubject: "Verify your account for Jongleur!",
        emailBody: "Thanks for signing up for Jongleur! Your verification code is {####}",
        emailStyle: cognito.VerificationEmailStyle.CODE,
        smsMessage: "Thanks for signing up for Jongleur! Your verification code is {####}",
      },
      userInvitation: {
        emailSubject: "Invite to join Jongleur!",
        emailBody: "Hello {username}, you have been invited to join Jongleur! Your temporary password is {####}",
        smsMessage: "Hello {username}, your temporary password for Jongleur is {####}",
      },
      signInAliases: {
        username: true,
        email: true,
      },
      passwordPolicy: {
        requireLowercase: false,
        requireUppercase: false,
        requireDigits: false,
        requireSymbols: false,
        minLength: 6,
      },
    });

    // Our GraphQL resolver is a client of the user pool, meaning it can invoke user pool
    // operations. Since we set generateSecret to true, its requests must come with a
    // MAC to ensure it is not impersonated.
    const userPoolClient = userPool.addClient("JongleurGraphQlClient", {
      generateSecret: true,
      refreshTokenValidity: Duration.days(30),
      accessTokenValidity: Duration.minutes(60),
      idTokenValidity: Duration.minutes(60),
      enableTokenRevocation: true,
      preventUserExistenceErrors: true,
      authFlows: {
        // Enables server-side username / password authentication.
        adminUserPassword: true,
      },
    });

    // The GraphQL API for our data.
    const api = new appsync.GraphqlApi(this, "JongleurApi", {
      name: "JongleurApi",
      // Path to our graphql schema. We don't use the cdk code-first approach because
      // having a schema file allows us to use graphql tooling throughout our project.
      schema: appsync.Schema.fromAsset(props.graphqlSchemaFile),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.API_KEY,
        },
      },
      xrayEnabled: true,
    });

    // The table that keeps track of our pieces.
    const pieceTable = new dynamodb.Table(this, "PieceTable", {
      partitionKey: {
        name: "id",
        // GraphQL ID types are represented as STRING in dynamodb.
        type: dynamodb.AttributeType.STRING,
      },

      // On-demand, completely serverless.
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      // So as to not litter our account with tables.
      // TODO: change to RETAIN in production deployments.
      removalPolicy: cdk.RemovalPolicy.DESTROY,

      contributorInsightsEnabled: true,
    });

    // The table that keeps track of user Practices.
    const practiceTable = new dynamodb.Table(this, "PracticeTable", {
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      contributorInsightsEnabled: true,
    });
    // We want to be able to query this table by the user
    // that the practices are associated with.
    practiceTable.addGlobalSecondaryIndex({
      indexName: "userId_index",
      partitionKey: {
        name: "userId",
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    // We want to be able to query this table by the piece
    // that the practices are associated with.
    practiceTable.addGlobalSecondaryIndex({
      indexName: "pieceId_index",
      partitionKey: {
        name: "pieceId",
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    /*
    // The table that keeps track of our user Principals.
    const principalTable = new dynamodb.Table(this, "PrincipalTable", {
      partitionKey: {
        name: "userId",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      contributorInsightsEnabled: true,
    });*/

    // The lambda resolver that we use for all our GraphQL queries and mutations.
    // We don't use dynamodb data sources and resolver templates because they don't work.
    const apiResolverLambda = new nodelambda.NodejsFunction(this, "ApiResolverLambda", {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: "graphql/resolvers/resolve.ts",
      handler: "lambdaHandler",
      tracing: lambda.Tracing.ACTIVE,

      timeout: Duration.seconds(30),

      bundling: {
        minify: true,
        banner: "/* (c) Jongleur; minified and bundled through @aws-cdk/aws-lambda-nodejs. */",
      },

      environment: {
        JONG_DYNAMODB_REGION: props.env!.region!,
        JONG_COGNITO_REGION: props.env!.region!,
        JONG_PIECE_TABLE: pieceTable.tableName,
        JONG_PRACTICE_TABLE: practiceTable.tableName,
        //JONG_PRINCIPAL_TABLE: principalTable.tableName,
        JONG_USER_POOL_ID: userPool.userPoolId,
        JONG_USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      },
    });
    // Add some resource permissions to our resolver.
    pieceTable.grantReadWriteData(apiResolverLambda);
    practiceTable.grantReadWriteData(apiResolverLambda);
    //principalTable.grantReadWriteData(apiResolverLambda);
    // Add some additional cognito permissions to our resolver.
    const resolverCognitoPolicy = new iam.PolicyStatement();
    resolverCognitoPolicy.addResources(userPool.userPoolArn);
    resolverCognitoPolicy.addActions(
      "cognito-idp:DescribeUserPoolClient",
      "cognito-idp:AdminConfirmSignUp",
      "cognito-idp:AdminInitiateAuth"
    );
    apiResolverLambda.addToRolePolicy(resolverCognitoPolicy);

    // The data source that our lambda resolves. Used for all queries and mutations.
    const apiLambdaDataSource = api.addLambdaDataSource("ApiLambdaDataSource", apiResolverLambda);

    /* GraphQL field resolvers. We don't have to define a resolver for every type, since fields
     * can be resolved by default if their parent query contains a field that matches its name.
     * For all other cases, we define resolvers to fetch our custom types. */

    // Query parent.
    apiLambdaDataSource.createResolver({
      typeName: QUERY_TYPE,
      fieldName: "readPieces",
    });
    /*apiLambdaDataSource.createResolver({
      typeName: QUERY_TYPE,
      fieldName: "readCollection",
    });*/
    apiLambdaDataSource.createResolver({
      typeName: QUERY_TYPE,
      fieldName: "readAuthenticate",
    });

    // Mutation parent.
    apiLambdaDataSource.createResolver({
      typeName: MUTATION_TYPE,
      fieldName: "createCollection",
    });
    apiLambdaDataSource.createResolver({
      typeName: MUTATION_TYPE,
      fieldName: "createUser",
    });
    apiLambdaDataSource.createResolver({
      typeName: MUTATION_TYPE,
      fieldName: "createSession",
    });
    apiLambdaDataSource.createResolver({
      typeName: MUTATION_TYPE,
      fieldName: "refreshSession",
    });

    // Collection parent.
    apiLambdaDataSource.createResolver({
      typeName: "Collection",
      fieldName: "casts",
    });

    // AuthenticatedUser parent.
    apiLambdaDataSource.createResolver({
      typeName: "AuthenticatedUser",
      fieldName: "collections",
    });

    /** Our Remix container. */
    /*
    const imageAsset = new DockerImageAsset(this, "ImageAssets", {
      directory: ".",
    });
    new apprunner.Service(this, "JongleurService", {
      source: apprunner.Source.fromAsset({
        imageConfiguration: { port: 3000 },
        asset: imageAsset,
      }),
    });*/
  }
}
