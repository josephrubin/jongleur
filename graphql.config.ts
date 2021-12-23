import type { IGraphQLConfig } from "graphql-config";

/* This file contains the configuration for the garphql in this project.
More advanced configuration also allows multiplexing by application. */
const config: IGraphQLConfig = {
  schema: "graphql/schema.graphql",
  documents: ["app/**/*.graphql", "app/**/*.tsx", "app/**/*.ts"],
  include: ["app/**/*.txs", "app/**/*.ts"],
};

export default config;
