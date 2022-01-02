import { SFN } from "@aws-sdk/client-sfn";
import { v4 as uuidv4 } from "uuid";

const STATEMACHINE_ARN = process.env.JONG_STATEMACHINE_ARN;

const sfnClient = new SFN({
  region: process.env.JONG_STEPFUNCTIONS_REGION,
});

const lambdaHandler = async (event: object) => {
  try {
    // Start the execution (we await the starting but the actual
    // execution happens in the background).
    const executionName = `lambda-to-stepfunction-${uuidv4()}`;
    const executionStart = await sfnClient.startExecution({
      stateMachineArn: STATEMACHINE_ARN,
      name: executionName,
      input: JSON.stringify({
        ...event,
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
};

exports.lambdaHandler = lambdaHandler;
