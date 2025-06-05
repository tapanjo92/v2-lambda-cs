var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// index.ts
var index_exports = {};
__export(index_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(index_exports);
var import_aws_sdk = require("aws-sdk");
var ddb = new import_aws_sdk.DynamoDB.DocumentClient();
var TABLE_NAME = process.env.TABLE_NAME;
async function handler(event, context) {
  if (event.httpMethod === "GET") {
    const claims = event.requestContext?.authorizer?.claims;
    const tenantId = claims?.sub || "demo-tenant";
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: "tenantId = :tenantId",
      ExpressionAttributeValues: {
        ":tenantId": tenantId
      },
      ScanIndexForward: false,
      // newest first
      Limit: 20
    };
    const data = await ddb.query(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify(data.Items || []),
      headers: { "Content-Type": "application/json" }
    };
  }
  if (event.httpMethod === "POST") {
    let logEvent = event.body ? JSON.parse(event.body) : event;
    const claims = event.requestContext?.authorizer?.claims;
    const tenantId = claims?.sub || "demo-tenant";
    await ddb.put({
      TableName: TABLE_NAME,
      Item: {
        tenantId,
        timestamp: Date.now(),
        event: logEvent
      }
    }).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  }
  return {
    statusCode: 405,
    body: JSON.stringify({ error: "Method not allowed" })
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
