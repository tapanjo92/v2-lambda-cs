#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { LambdaColdStartStack } from '../lib/cdk-stack';

const app = new cdk.App();
new LambdaColdStartStack(app, 'LambdaColdStartStack', {
  env: {
    region: 'ap-south-1',
    // Optionally set account: process.env.CDK_DEFAULT_ACCOUNT,
  },
});

