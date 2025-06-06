import { CognitoUserPool } from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID ?? '',
  ClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID ?? ''
};

export const userPool = new CognitoUserPool(poolData);
