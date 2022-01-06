import { Construct } from "constructs";
import {
  Duration,
  Expiration,
  aws_cognito as cognito,
  aws_iam as iam
} from "aws-cdk-lib";
import * as appsync from "@aws-cdk/aws-appsync-alpha";
import { makeNodejsLambda } from "./make-defaults";
import { JongleurAuthConstruct } from "./jongleur-auth-construct";
import { JongleurDataConstruct } from "./jongleur-data-construct";

interface JongleurGraphqlConstructProps {
  readonly graphqlSchemaFile: string;
  readonly authConstruct: JongleurAuthConstruct;
  readonly dataConstruct: JongleurDataConstruct;
  readonly region: string;
}

const QUERY_TYPE = "Query";
const MUTATION_TYPE = "Mutation";

/**
 * Infrastructure for Jongleur "middle-end," that is, the internal
 * GraphQl API and an authenticated client that allows the API to
 * interact with our user pool.
 */
export class JongleurGraphqlConstruct extends Construct {
  private _api: appsync.GraphqlApi;
  private _userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: JongleurGraphqlConstructProps) {
    super(scope, id);

    // ------------------------------------------------------------------------
    // Interface.
    // ------------------------------------------------------------------------

    // The GraphQL API for our data.
    this._api = new appsync.GraphqlApi(this, "JongleurGraphqlApi", {
      name: "JongleurGraphqlApi",
      // Path to our graphql schema. We don't use the cdk code-first approach because
      // having a schema file allows us to use graphql tooling throughout our project.
      schema: appsync.Schema.fromAsset(props.graphqlSchemaFile),
      authorizationConfig: {
        // Use lambda authorization. See the lambda code for more details on this choice.
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.LAMBDA,
          lambdaAuthorizerConfig: {
            handler: makeNodejsLambda(this, "JongleurGraphqlApiAuthorizer", {
              entry: "graphql/authorizer.ts",
              description: "Jongleur - authorization for our GraphQL API.",
              timeout: Duration.seconds(1),
            }),
            resultsCacheTtl: Duration.minutes(10),
          },
        },
      },
      xrayEnabled: true,
    });

    // Our GraphQL resolver is a client of the user pool, meaning it can invoke user pool
    // operations. Since we set generateSecret to true, its requests must come with a
    // MAC to ensure it is not impersonated.
    this._userPoolClient = props.authConstruct.userPool.addClient("JongleurGraphqlClient", {
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

    // ------------------------------------------------------------------------
    // Resolution.
    // ------------------------------------------------------------------------

    // The lambda resolver that we use for all our GraphQL queries and mutations.
    // We don't use dynamodb data sources and resolver templates because they
    // don't work and I don't like them.
    const apiResolverLambda = makeNodejsLambda(this, "ApiResolverLambda", {
      entry: "graphql/resolvers/resolve.ts",
      description: "Jongleur - resolve GraphQL requests.",

      timeout: Duration.seconds(30),

      environment: {
        JONG_DYNAMODB_REGION: props.region,
        JONG_COGNITO_REGION: props.region,
        JONG_PIECE_TABLE: props.dataConstruct.pieceTable.tableName,
        JONG_PRACTICE_TABLE: props.dataConstruct.practiceTable.tableName,
        JONG_USER_POOL_ID: props.authConstruct.userPool.userPoolId,
        JONG_USER_POOL_CLIENT_ID: this._userPoolClient.userPoolClientId,
      },
    });
    // Add some resource permissions to our resolver.
    props.dataConstruct.pieceTable.grantReadWriteData(apiResolverLambda);
    props.dataConstruct.practiceTable.grantReadWriteData(apiResolverLambda);
    // Add some additional cognito permissions to our resolver.
    const resolverCognitoPolicy = new iam.PolicyStatement();
    resolverCognitoPolicy.addResources(props.authConstruct.userPool.userPoolArn);
    resolverCognitoPolicy.addActions(
      "cognito-idp:DescribeUserPoolClient",
      "cognito-idp:AdminConfirmSignUp",
      "cognito-idp:AdminInitiateAuth"
    );
    apiResolverLambda.addToRolePolicy(resolverCognitoPolicy);

    // The data source that our lambda resolves. Used for all queries and mutations.
    const apiLambdaDataSource = this._api.addLambdaDataSource("ApiLambdaDataSource", apiResolverLambda);

    /* GraphQL field resolvers. We don't have to define a resolver for every type, since fields
     * can be resolved by default if their parent query contains a field that matches its name.
     * For all other cases, we define resolvers to fetch our custom types. */

    /* See graphql/schema.graphql for comments on these types.
     * Since we try to fragment our data as little as possible, we defer to the
     * default resolver for most subtypes. For example, you'll notice that there
     * is no resolver (or dynamodb table) for Segment. Instead, segments are kept
     * in the Practice table and always returne with Practices. */

    // Query parent.
    apiLambdaDataSource.createResolver({
      typeName: QUERY_TYPE,
      fieldName: "readPieces",
    });
    apiLambdaDataSource.createResolver({
      typeName: QUERY_TYPE,
      fieldName: "readPiece",
    });
    apiLambdaDataSource.createResolver({
      typeName: QUERY_TYPE,
      fieldName: "readAuthenticate",
    });

    // Mutation parent.
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

    // AuthenticatedUser parent.
    apiLambdaDataSource.createResolver({
      typeName: "AuthenticatedUser",
      fieldName: "practices",
    });
    apiLambdaDataSource.createResolver({
      typeName: "AuthenticatedUser",
      fieldName: "practice",
    });

    // Practice parent.
    apiLambdaDataSource.createResolver({
      typeName: "Practice",
      fieldName: "piece",
    });
  }

  get api() {
    return this._api;
  }

  get userPoolClient() {
    return this._userPoolClient;
  }
}
