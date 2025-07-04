import { Stack, StackProps, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';

export class LambdaColdStartStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // 1. Cognito User Pool
    const userPool = new cognito.UserPool(this, 'UserPool', {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: { email: { required: true, mutable: false } },
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      generateSecret: false,
    });

    // 2. DynamoDB Table
    const table = new dynamodb.Table(this, 'ColdStartEvents', {
      partitionKey: { name: 'tenantId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // 3. Lambda for log processing
    const logProcessor = new lambda.Function(this, 'LogProcessor', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../backend'), // Ensure index.js is in ../backend
      environment: {
        TABLE_NAME: table.tableName,
      },
    });
    table.grantReadWriteData(logProcessor);

    // 4. API Gateway
    const api = new apigateway.RestApi(this, 'LambdaColdStartApi', {
      restApiName: 'Lambda Cold Start Service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS, // Consider restricting in production
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-Amz-User-Agent',
        ],
      },
      deployOptions: {
        stageName: 'prod',
      },
    });


    // Customer 1
    const customerOneAccountId = '809555764832';
    const cloudwatchLogsPrincipalCustomerOne = `logs.${this.region}.amazonaws.com`;

    api.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.AnyPrincipal()],
      actions: ['execute-api:Invoke'],
      resources: ['*'],
    }));

    // Customer 2

    // ---
    // ## section 7: API Gateway Method Definitions
    // ---
    const ingestResource = api.root.addResource('ingest');
    ingestResource.addMethod('POST', new apigateway.LambdaIntegration(logProcessor), {
      authorizationType: apigateway.AuthorizationType.IAM,
    });
    ingestResource.addMethod('GET', new apigateway.LambdaIntegration(logProcessor), {
      authorizationType: apigateway.AuthorizationType.IAM,
    });

    // ---
    // ## section 8: CDK output for convenience
    // ---
    new CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId });
    new CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId });
    new CfnOutput(this, 'ApiEndpoint', { value: api.url });
    new CfnOutput(this, 'TableName', { value: table.tableName });
    new CfnOutput(this, 'ApiId', {value: api.restApiId });
  }
}
