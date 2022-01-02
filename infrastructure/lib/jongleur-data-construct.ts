import { Construct } from "constructs";
import {
  RemovalPolicy,
  aws_dynamodb as dynamodb
} from "aws-cdk-lib";

/**
 * Infrastructure for Jongleur data layer, that is, the persistant
 * database storage (but generally not S3 buckets) that contains
 * user- and global-information for the app.
 */
export class JongleurDataConstruct extends Construct {
  private _pieceTable: dynamodb.Table;
  private _practiceTable: dynamodb.Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // The table that keeps track of our pieces.
    this._pieceTable = new dynamodb.Table(this, "PieceTable", {
      partitionKey: {
        name: "id",
        // GraphQL ID types are represented as STRING in dynamodb.
        type: dynamodb.AttributeType.STRING,
      },

      // On-demand, completely serverless.
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      // So as to not litter our account with tables.
      // TODO: change to RETAIN in production deployments.
      removalPolicy: RemovalPolicy.DESTROY,

      contributorInsightsEnabled: true,
    });

    // The table that keeps track of user Practices.
    this._practiceTable = new dynamodb.Table(this, "PracticeTable", {
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
      contributorInsightsEnabled: true,
    });
    // We want to be able to query this table by the user
    // that the practices are associated with.
    this._practiceTable.addGlobalSecondaryIndex({
      indexName: "userId_index",
      partitionKey: {
        name: "userId",
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    // We want to be able to query this table by the piece
    // that the practices are associated with.
    this._practiceTable.addGlobalSecondaryIndex({
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
  }

  get pieceTable() {
    return this._pieceTable;
  }

  get practiceTable() {
    return this._practiceTable;
  }
}
