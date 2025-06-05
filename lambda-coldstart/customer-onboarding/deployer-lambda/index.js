const AWS = require('aws-sdk');
const logs = new AWS.CloudWatchLogs();

const RELAY_ARN = process.env.RELAY_ARN;

async function subscribeLogGroup(logGroupName) {
  // Only for Lambda log groups
  if (!logGroupName.startsWith('/aws/lambda/')) return;

  // Don't re-subscribe
  const filters = await logs.describeSubscriptionFilters({ logGroupName }).promise();
  if (filters.subscriptionFilters.some(f => f.destinationArn === RELAY_ARN)) return;

  await logs.putSubscriptionFilter({
    logGroupName,
    filterName: 'RelayLambdaSubscription',
    filterPattern: '"START RequestId"', // Only cold start logs if you want, or adjust
    destinationArn: RELAY_ARN
  }).promise();

  console.log(`Subscribed: ${logGroupName}`);
}

exports.handler = async (event) => {
  // If triggered by EventBridge for a new log group
  if (event.detail && event.detail.requestParameters && event.detail.requestParameters.logGroupName) {
    await subscribeLogGroup(event.detail.requestParameters.logGroupName);
    return;
  }

  // Initial/manual run: subscribe all
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
};

