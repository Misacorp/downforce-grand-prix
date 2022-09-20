import { Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { DownforceGrandPrixStack } from "./downforce-grand-prix-stack";

/**
 * Deployable unit of web service app
 */
export class DownforceGrandPrixStage extends Stage {
  constructor(scope: Construct, id: string, props?: StageProps) {
    super(scope, id, props);

    new DownforceGrandPrixStack(this, "WebService");
  }
}
