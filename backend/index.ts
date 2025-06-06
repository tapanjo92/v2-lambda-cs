import { DynamoDB } from 'aws-sdk';
import { Context } from 'aws-lambda';

const ddb = new DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME!;

export async function handler(event: any, context: Context) {
  // For API Gateway proxy integration, event.httpMethod is set
  if (event.httpMethod === 'GET') {
    // Get current user's sub/tenant from Cognito claims
    const tenantId = event.requestContext?.identity?.accountId || 'demo-tenant';

    // Optionally: parse query params (e.g. for filtering, pagination)
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: 'tenantId = :tenantId',
      ExpressionAttributeValues: {
        ':tenantId': tenantId,
      },
      ScanIndexForward: false, // newest first
      Limit: 20,
    };

    const data = await ddb.query(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify(data.Items || []),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  // POST: Store event
  if (event.httpMethod === 'POST') {
    let logEvent = event.body ? JSON.parse(event.body) : event;
    const tenantId = event.requestContext?.identity?.accountId || 'demo-tenant';

    await ddb.put({
      TableName: TABLE_NAME,
      Item: {
        tenantId: tenantId,
        timestamp: Date.now(),
        event: logEvent,
      },
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  }

  // Default fallback
  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Method not allowed' }),
  };
}
