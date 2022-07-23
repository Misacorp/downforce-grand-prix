import { Duration, Stack, StackProps } from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { AttributeType, BillingMode } from "aws-cdk-lib/aws-dynamodb";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import * as path from "path";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export class DownforceGrandPrixStack extends Stack {
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
    this.initDownforceGrandPrix();
  }

  /**
   * Initializes the Downforce Grand Prix stack
   * @private
   */
  private initDownforceGrandPrix() {
    this.initTable();
    this.initLambdas();
    this.setLambdaPermissions();
    this.initApi();
  }

  /**
   * Defines a DynamoDB table and its global secondary indexes
   */
  private initTable = () => {
    this.table = new dynamodb.Table(this, "Table", {
      partitionKey: { name: "pk1", type: AttributeType.STRING },
      sortKey: { name: "sk1", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    // Add global secondary indexes
    this.table.addGlobalSecondaryIndex({
      indexName: "gsi2",
      partitionKey: { name: "pk2", type: AttributeType.STRING },
      sortKey: { name: "sk2", type: AttributeType.STRING },
    });

    this.table.addGlobalSecondaryIndex({
      indexName: "gsi3",
      partitionKey: { name: "pk3", type: AttributeType.STRING },
    });
  };

  /**
   * Defined Lambda functions
   */
  private initLambdas = () => {
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
  };

  /**
   * Grant lambda functions the permissions they require
   */
  private setLambdaPermissions = () => {
    this.table.grantReadWriteData(this.createGameResultsLambda);

    this.table.grantReadData(this.getGameResultsLambda);

    this.table.grantWriteData(this.createSeasonLambda);

    this.table.grantReadData(this.getSeasonsLambda);
  };

  /**
   * Define an API
   */
  private initApi = () => {
    this.api = new apigw.RestApi(this, "downforce-api");

    this.addGameRoutes();
    this.addSeasonRoutes();
  };

  /**
   * Add game routes to the API
   */
  private addGameRoutes = () => {
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
  };

  /**
   * Adds season routes to the API
   */
  private addSeasonRoutes = () => {
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
  };
}
