import { Construct } from "constructs";
import {
  CfnOutput,
  Stack,
  StackProps,
  Duration,
  Environment,
  aws_lambda as lambda,
  aws_lambda_nodejs as node_lambda,
  aws_iam as iam
} from "aws-cdk-lib";
import { JongleurAuthConstruct } from "./jongleur-auth-construct";
import { JongleurGraphqlConstruct } from "./jongleur-graphql-construct";
import { JongleurDataConstruct } from "./jongleur-data-construct";
import { JongleurWebappConstruct } from "./jongleur-webapp-construct";
import { JongleurAudioConstruct } from "./jongleur-audio-construct";

interface JongleurInfrastructureStackProps extends Omit<StackProps, "env"> {
  // The DNS name that the Jongleur web app should be hosted at.
  readonly webappDomainName: string;
  // Path to the file that contains the graphql schema for our API.
  readonly graphqlSchemaFile: string;
  // Override the parent type to make env deeply required.
  readonly env: Required<Environment>;
}

/**
 * Infrastructure that powers the entire Jongleur application stack.
 * Right now it's just a single stack because we can describe the infra
 * in a few hundred lines of code.
 * If it gets any bigger we should refactor the front-end, middle-end (APIs),
 * audio upload end, and back end into different nested stacks.
 */
export class JongleurInfrastructureStack extends Stack {
  constructor(scope: Construct, id: string, props: JongleurInfrastructureStackProps) {
    super(scope, id, props);

    // ------------------------------------------------------------------------
    // Auth (user account authentication and authorization).
    // ------------------------------------------------------------------------

    const authConstruct = new JongleurAuthConstruct(this, "JongleurAuthConstruct");

    // ------------------------------------------------------------------------
    // Data (tables that contain application information).
    // ------------------------------------------------------------------------

    const dataConstruct = new JongleurDataConstruct(this, "JongleurDataConstruct");

    // ------------------------------------------------------------------------
    // API (internal bridge between client and data).
    // ------------------------------------------------------------------------

    const graphqlConstruct = new JongleurGraphqlConstruct(this, "JongleurGraphqlConstruct", {
      graphqlSchemaFile: props.graphqlSchemaFile,
      authConstruct: authConstruct,
      dataConstruct: dataConstruct,
      region: props.env.region,
    });

    // ------------------------------------------------------------------------
    // Audio (uploading, storage, and processing audio files).
    // ------------------------------------------------------------------------

    const audioConstruct = new JongleurAudioConstruct(this, "JongleurAudioConstruct", {
      userPool: authConstruct.userPool,
      userPoolClient: graphqlConstruct.userPoolClient,
      practiceTable: dataConstruct.practiceTable,
      region: props.env.region,
    });

    // ------------------------------------------------------------------------
    // WWW (web app front end).
    // ------------------------------------------------------------------------

    const webappConstruct = new JongleurWebappConstruct(this, "JongleurWebappConstruct", {
      domainName: props.webappDomainName,
      dockerAppDirectory: ".",
      dockerAppPort: 3000,
      graphqlApi: graphqlConstruct.api,
    });

    graphqlConstruct.api.grantQuery(webappConstruct.role);
    graphqlConstruct.api.grantMutation(webappConstruct.role);

    // ------------------------------------------------------------------------
    // Output (results from this stack's synthesis).
    // ------------------------------------------------------------------------

    new CfnOutput(this, "JongGraphqlUrl", {
      description: "The URL of the Jongleur internal GraphQL service.",
      value: graphqlConstruct.api.graphqlUrl,
    });

    new CfnOutput(this, "JongGraphqlDevApiKey", {
      description: "The development API key of the JongGraphGl API.",
      value: graphqlConstruct.api.apiKey || "",
    });
  }
}
