#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { DownforceGrandPrixStack } from "../lib/downforce-grand-prix-stack";
import { DownforceGrandPrixPipelineStack } from "../lib/downforce-grand-prix-pipeline-stack";

const app = new cdk.App();

new DownforceGrandPrixPipelineStack(app, "DownforceGrandPrixPipelineStack");
