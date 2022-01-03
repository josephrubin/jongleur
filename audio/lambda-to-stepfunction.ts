import { SFN } from "@aws-sdk/client-sfn";
import { v4 as uuidv4 } from "uuid";

const STATEMACHINE_ARN = process.env.JONG_STATEMACHINE_ARN;

const sfnClient = new SFN({
  region: process.env.JONG_STEPFUNCTIONS_REGION,
});

/**
 * Partial type for the event passed when a lambda is triggered
 * by an S3 notification.
 */
interface s3NotificationEventRecord {
  eventName: string;
  s3: {
    bucket: {
      name: string;
    },
    object: {
      key: string;
      size: number;
      eTag: string;
    }
  };
}

const lambdaHandler = async (event: {Records: s3NotificationEventRecord[]}) => {
  const handlerExecutionId = uuidv4();

  // I don't expect more than one record to come through at once, but in theory
  // we should have no problem handling batches.
  for (let i = 0; i < event.Records.length; i++) {
    const record = event.Records[i];
    if (record.eventName !== "ObjectCreated:Put") {
      throw `Invalid eventName: ${record.eventName}. We only handle Put events here.`;
    }

    try {
      // Start the execution (we await the starting but the actual
      // execution happens in the background).
      const executionName = `lambda-to-sfn-${handlerExecutionId}-record-${i}`;
      const executionStart = await sfnClient.startExecution({
        stateMachineArn: STATEMACHINE_ARN,
        name: executionName,
        input: JSON.stringify({
          bucket: record.s3.bucket.name,
          key: record.s3.object.key,
          size: record.s3.object.size,
          requestEpoch: String(Date.now()),
          // Give a uuid as input in case the step function wants one.
          uuid: uuidv4(),
        }),
      });
      console.log(`Started execution ${executionName} with ARN ${executionStart.executionArn} of state machine ${STATEMACHINE_ARN}.`);
    }
    catch (err) {
      const errorMessage = `Failed to start state machine: ${STATEMACHINE_ARN}. Error: ${String(err)}`;
      console.log(errorMessage);
      throw errorMessage;
    }
  }
};

exports.lambdaHandler = lambdaHandler;
