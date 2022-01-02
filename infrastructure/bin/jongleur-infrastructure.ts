#!/usr/bin/env node
import "source-map-support/register";
import { App } from "aws-cdk-lib";
import { JongleurInfrastructureStack } from "../lib/jongleur-infrastructure-stack";

const app = new App();
new JongleurInfrastructureStack(app, "JongleurInfrastructureStack", {
  webappDomainName: "www.jongleur.app",
  graphqlSchemaFile: "graphql/schema.graphql",
  env: {
    account: "987352247039",
    region: "us-east-1",
  },
});
