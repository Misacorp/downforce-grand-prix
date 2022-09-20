import { SecretValue, Stack, StackProps } from "aws-cdk-lib";
import * as pipelines from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { DownforceGrandPrixStage } from "./downforce-grand-prix-stage";

export class DownforceGrandPrixPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const pipeline = new pipelines.CodePipeline(this, "Pipeline", {
      synth: new pipelines.ShellStep("Synth", {
        // Expects a secret with the name 'github-token' to exist in AWS Secrets Manager. It should contain a GitHub personal access token as plaintext.
        input: pipelines.CodePipelineSource.gitHub(
          "Misacorp/downforce-grand-prix",
          "main",
          {
            authentication: SecretValue.secretsManager("github-token"),
          }
        ),
        commands: ["npm ci", "npm run build", "npx cdk synth"],
      }),
    });

    // Create and add stages
    const devStage = new DownforceGrandPrixStage(this, "dev");
    const prdStage = new DownforceGrandPrixStage(this, "prd");

    pipeline.addStage(devStage);
    pipeline.addStage(prdStage, {
      // Add a manual approval action before this stage is run
      pre: [new pipelines.ManualApprovalStep("PromoteToProduction")],
    });
  }
}
