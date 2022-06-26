import { CfnOutput, Duration, Stack, StackProps } from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import { AttributeType, BillingMode } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import * as path from "path";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export class DownforceGrandPrixStack extends Stack {
  private helloTable: dynamodb.Table;
  private helloLambda: lambda.Function;
  private echoLambda: lambda.Function;
  private helloApiGw: apigw.RestApi;

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
    this.initHello();
    this.initMessages();
  }

  /**
   * Initializes the Hello template used mainly for testing and learning
   * @private
   */
  private initHello() {
    // Create DynamoDB table
    this.helloTable = new dynamodb.Table(this, "Hello", {
      partitionKey: { name: "id", type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    // Create Lambda
    this.helloLambda = new NodejsFunction(this, "HelloLambda", {
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: path.join(__dirname, "../services/hello.ts"),
      handler: "handler",
      timeout: Duration.seconds(3),
      memorySize: 128,
      environment: {
        HELLO_TABLE_NAME: this.helloTable.tableName,
      },
    });

    // Create Echo Lambda
    this.echoLambda = new NodejsFunction(this, "EchoLambda", {
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: path.join(__dirname, "../services/echo.ts"),
      handler: "handler",
      timeout: Duration.seconds(3),
      memorySize: 128,
    });

    this.helloTable.grantReadWriteData(this.helloLambda);

    // Create API Gateway
    this.helloApiGw = new apigw.RestApi(this, "hello-api");

    // Hello
    this.helloApiGw.root
      .resourceForPath("hello")
      .addMethod("GET", new apigw.LambdaIntegration(this.helloLambda));

    // Echo
    this.helloApiGw.root
      .resourceForPath("echo")
      .addMethod("POST", new apigw.LambdaIntegration(this.echoLambda));

    // Display API URL on deployment
    new CfnOutput(this, "HTTP API URL", {
      value: this.helloApiGw.url ?? "Something went wrong with the deployment",
    });
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
}
