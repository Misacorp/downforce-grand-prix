#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { DownforceGrandPrixStack } from '../lib/downforce-grand-prix-stack';

const app = new cdk.App();
new DownforceGrandPrixStack(app, 'DownforceGrandPrixStack');
