import { Duration, Stack, StackProps } from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { AttributeType, BillingMode } from "aws-cdk-lib/aws-dynamodb";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import * as path from "path";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export class DownforceGrandPrixStack extends Stack {
  // Messages Demo
  private messageTable: dynamodb.Table;
  private createMessageLambda: lambda.Function;
  private readMessageLambda: lambda.Function;
  private messageApiGw: apigw.RestApi;

  // Downforce Grand Prix
  private table: dynamodb.Table;
  private createGameResultsLambda: lambda.Function;
  private getGameResultsLambda: lambda.Function;
  private createSeasonLambda: lambda.Function;
  private getSeasonsLambda: lambda.Function;
  private api: apigw.RestApi;

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
    this.initDownforceGrandPrix();
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
    // Create DynamoDB table
    this.table = new dynamodb.Table(this, "Table", {
      partitionKey: { name: "pk1", type: AttributeType.STRING },
      sortKey: { name: "sk1", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    // Add global secondary indices
    this.table.addGlobalSecondaryIndex({
      indexName: "gsi1",
      partitionKey: { name: "pk2", type: AttributeType.STRING },
      sortKey: { name: "sk2", type: AttributeType.STRING },
    });

    this.table.addGlobalSecondaryIndex({
      indexName: "gsi2",
      partitionKey: { name: "pk3", type: AttributeType.STRING },
    });

    // Create game result lambda
    this.createGameResultsLambda = new NodejsFunction(
      this,
      "CreateGameResult",
      {
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: path.join(__dirname, "../services/createGameResult.ts"),
        handler: "handler",
        timeout: Duration.seconds(3),
        memorySize: 128,
        environment: {
          TABLE_NAME: this.table.tableName,
        },
      }
    );

    this.table.grantReadWriteData(this.createGameResultsLambda);

    // Get game result lambda
    this.getGameResultsLambda = new NodejsFunction(this, "GetGameResult", {
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: path.join(__dirname, "../services/getGameResult.ts"),
      handler: "handler",
      timeout: Duration.seconds(3),
      memorySize: 128,
      environment: {
        TABLE_NAME: this.table.tableName,
      },
    });

    this.table.grantReadData(this.getGameResultsLambda);

    // Create season lambda
    this.createSeasonLambda = new NodejsFunction(this, "CreateSeason", {
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: path.join(__dirname, "../services/createSeason.ts"),
      handler: "handler",
      timeout: Duration.seconds(3),
      memorySize: 128,
      environment: {
        TABLE_NAME: this.table.tableName,
      },
    });

    this.table.grantWriteData(this.createSeasonLambda);

    // Get all seasons lambda
    this.getSeasonsLambda = new NodejsFunction(this, "GetSeasons", {
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: path.join(__dirname, "../services/getSeasons.ts"),
      handler: "handler",
      timeout: Duration.seconds(3),
      memorySize: 128,
      environment: {
        TABLE_NAME: this.table.tableName,
      },
    });

    this.table.grantReadData(this.getSeasonsLambda);

    // Create API
    this.api = new apigw.RestApi(this, "downforce-api");

    // Add game routes
    const gameResultsResource = this.api.root.addResource("game");

    gameResultsResource.addMethod(
      "POST",
      new apigw.LambdaIntegration(this.createGameResultsLambda)
    );

    // Single game
    const gameResultResource = gameResultsResource.addResource("{gameId}");

    gameResultResource.addMethod(
      "GET",
      new apigw.LambdaIntegration(this.getGameResultsLambda)
    );

    // Add season routes
    const seasonsResource = this.api.root.addResource("season");

    seasonsResource.addMethod(
      "POST",
      new apigw.LambdaIntegration(this.createSeasonLambda)
    );

    // Get seasons route
    seasonsResource.addMethod(
      "GET",
      new apigw.LambdaIntegration(this.getSeasonsLambda)
    );
  }
}
