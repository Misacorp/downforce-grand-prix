import { Duration, Stack, StackProps } from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { AttributeType, BillingMode } from "aws-cdk-lib/aws-dynamodb";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import * as path from "path";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export class DownforceGrandPrixStack extends Stack {
  private messageTable: dynamodb.Table;
  private createMessageLambda: lambda.Function;
  private readMessageLambda: lambda.Function;
  private messageApiGw: apigw.RestApi;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.initialize();
  }

  /**
   * Initializes the stack and grants permission for stack components to access each other
   * @private
   */
  private initialize() {
    this.initMessages();
  }

  /**
   * Initializes the Messages template used for a demo message app
   * @private
   */
  private initMessages() {
    // Create DynamoDB table
    this.messageTable = new dynamodb.Table(this, "Message", {
      partitionKey: { name: "id", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    // Create Lambdas
    this.createMessageLambda = new NodejsFunction(this, "CreateMessageLambda", {
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: path.join(__dirname, "../services/createMessage.ts"),
      handler: "handler",
      timeout: Duration.seconds(3),
      memorySize: 128,
      environment: {
        MESSAGE_TABLE_NAME: this.messageTable.tableName,
      },
    });

    this.messageTable.grantWriteData(this.createMessageLambda);

    this.readMessageLambda = new NodejsFunction(this, "ReadMessageLambda", {
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: path.join(__dirname, "../services/readMessages.ts"),
      handler: "handler",
      timeout: Duration.seconds(3),
      memorySize: 128,
      environment: {
        MESSAGE_TABLE_NAME: this.messageTable.tableName,
      },
    });

    this.messageTable.grantReadData(this.readMessageLambda);

    // Create API Gateway
    this.messageApiGw = new apigw.RestApi(this, "messages-api");

    this.messageApiGw.root
      .resourceForPath("message")
      .addMethod("POST", new apigw.LambdaIntegration(this.createMessageLambda));

    this.messageApiGw.root
      .resourceForPath("message")
      .addMethod("GET", new apigw.LambdaIntegration(this.readMessageLambda));
  }

  /**
   * Initializes the Downforce Grand Prix stack
   * @private
   */
  private initDownforceGrandPrix() {
    let table: dynamodb.Table;
    let writeLambda: lambda.Function;
    let api: apigw.RestApi;

    // Create DynamoDB table
    table = new dynamodb.Table(this, "Table", {
      partitionKey: { name: "pk1", type: AttributeType.STRING },
      sortKey: { name: "sk1", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    // Add global secondary index
    table.addGlobalSecondaryIndex({
      indexName: "gsi1",
      partitionKey: { name: "pk2", type: AttributeType.STRING },
      sortKey: { name: "sk2", type: AttributeType.STRING },
    });

    // Create write lambda
    writeLambda = new NodejsFunction(this, "CreateResult", {
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: path.join(__dirname, "../services/createResult.ts"),
      handler: "handler",
      timeout: Duration.seconds(3),
      memorySize: 128,
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    table.grantWriteData(writeLambda);

    // Create API
    api = new apigw.RestApi(this, "downforce-api");

    // Add routes
    api.root
      .resourceForPath("game-result")
      .addMethod("POST", new apigw.LambdaIntegration(writeLambda));
  }
}
