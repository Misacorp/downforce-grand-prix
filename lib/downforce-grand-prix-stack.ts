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
  private helloApiGw: apigw.RestApi;

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
  }

  /**
   * Initializes the Hello template used mainly for testing and learning
   * @private
   */
  private initHello() {
    // Create DynamoDB table
    this.helloTable = new dynamodb.Table(this, "Hello", {
      partitionKey: { name: "name", type: AttributeType.STRING },
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

    this.helloTable.grantReadWriteData(this.helloLambda);

    // Create API Gateway
    this.helloApiGw = new apigw.RestApi(this, "hello-api");

    this.helloApiGw.root
      .resourceForPath("hello")
      .addMethod("GET", new apigw.LambdaIntegration(this.helloLambda));

    // Display API URL on deployment
    new CfnOutput(this, "HTTP API URL", {
      value: this.helloApiGw.url ?? "Something went wrong with the deployment",
    });
  }
}
