import { CognitoUserPool } from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: 'ap-south-1_5MT5O2bMt',
  ClientId: '4fb734d55fukgtd67indkjfs7i'
};

export const userPool = new CognitoUserPool(poolData);
