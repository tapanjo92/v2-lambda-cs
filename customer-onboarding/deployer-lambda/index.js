const https = require('https');
const AWS = require('aws-sdk');
const logs = new AWS.CloudWatchLogs();

const RELAY_ARN = process.env.RELAY_ARN;
const RELAY_FUNCTION_NAME = process.env.RELAY_FUNCTION_NAME ||
  (RELAY_ARN ? RELAY_ARN.split(':').pop() : '');

// Utility: sleep for ms milliseconds
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Core logic: subscribe a single log group, with retry/backoff
async function subscribeLogGroup(logGroupName) {
  if (!logGroupName.startsWith('/aws/lambda/')) return;
  if (logGroupName === `/aws/lambda/${RELAY_FUNCTION_NAME}`) return;

  // Retry logic for throttling
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const filters = await logs.describeSubscriptionFilters({ logGroupName }).promise();
      if (filters.subscriptionFilters.some(f => f.destinationArn === RELAY_ARN)) {
        return; // Already subscribed
      }
      await logs.putSubscriptionFilter({
        logGroupName,
        filterName: 'RelayLambdaSubscription',
        filterPattern: '"START RequestId"', // Adjust as needed
        destinationArn: RELAY_ARN
      }).promise();
      console.log(`Subscribed: ${logGroupName}`);
      await sleep(200); // Rate limiting: 200ms pause
      break; // Success
    } catch (err) {
      if (
        err.code === 'ThrottlingException' ||
        err.code === 'RateExceededException' ||
        /rate/i.test(err.message)
      ) {
        console.warn(`Throttled. Retrying ${logGroupName} in 1s...`);
        await sleep(1000);
      } else {
        console.error(`Failed to subscribe ${logGroupName}:`, err);
        throw err;
      }
    }
  }
}

// CloudFormation custom resource response
function sendResponse(event, context, status, reason) {
  const responseBody = JSON.stringify({
    Status: status,
    Reason: reason || 'See CloudWatch logs for details.',
    PhysicalResourceId: context.logStreamName,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Data: {}
  });
  const parsedUrl = new URL(event.ResponseURL);
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'PUT',
      headers: {
        'content-type': '',
        'content-length': responseBody.length
      }
    }, (res) => {
      res.on('data', () => {});
      res.on('end', resolve);
    });
    req.on('error', reject);
    req.write(responseBody);
    req.end();
  });
}

exports.handler = async (event, context) => {
  try {
    // Case 1: EventBridge trigger (new log group)
    if (event.detail && event.detail.requestParameters && event.detail.requestParameters.logGroupName) {
      await subscribeLogGroup(event.detail.requestParameters.logGroupName);
      return;
    }

    // Case 2: CloudFormation custom resource (initial deploy)
    if (event.RequestType) {
      let nextToken;
      do {
        const resp = await logs.describeLogGroups({
          logGroupNamePrefix: '/aws/lambda/',
          nextToken,
        }).promise();
        for (const group of resp.logGroups) {
          await subscribeLogGroup(group.logGroupName);
        }
        nextToken = resp.nextToken;
      } while (nextToken);

      // Always respond to CloudFormation
      await sendResponse(event, context, 'SUCCESS');
      return;
    }

    // Fallback
    return;
  } catch (err) {
    console.error(err);
    if (event.RequestType) {
      await sendResponse(event, context, 'FAILED', err.message || 'Unknown error');
    } else {
      throw err;
    }
  }
};

