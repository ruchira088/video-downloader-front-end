# cdk-deploy

AWS CDK infrastructure for the Video Downloader front-end, built on the shared
[`react-app-cdk-deploy`](https://github.com/ruchira088/react-app-cdk-deploy) construct. The stack
provisions the S3 bucket that holds the built SPA, a CloudFront distribution fronting it via an
origin access identity, an ACM certificate, and the Route 53 record for the domain. The bundle is
uploaded by a `CDKBucketDeployment` custom resource.

The `cdk.json` file tells the CDK Toolkit how to execute the app.

## Requirements

| Dependency | Version |
|------------|---------|
| Node.js | 24 (`engines.node: ^24.0.0`) |
| TypeScript | 7 |
| AWS CDK | 2 |

The stack entry point is `bin/cdk-deploy.ts`. There is **no `ts-node`** dependency: TypeScript 7
ships no JS compiler API, so `cdk.json` runs the entry point as `node bin/cdk-deploy.ts` and
relies on Node 24's native type stripping. The file must therefore stay within erasable syntax —
no enums, namespaces, parameter properties or runtime decorators.

The package is declared `"type": "module"`, so `tsc` emits ESM under `module: NodeNext`.

## Useful commands

| Command | Description |
|---------|-------------|
| `npm run build` | Type check and compile `bin/cdk-deploy.ts` to JS |
| `npm run cdk` | Run the CDK CLI (e.g. `npm run cdk -- diff`) |
| `npm run deploy` | Build, then deploy with `--require-approval=never` |
| `npm run cdk-deploy` | Deploy without building first |
| `npm run destroy` | Build, then destroy the stack with `--force` |
| `npm run cdk-destroy` | Destroy without building first |
| `npx cdk synth` | Emit the synthesized CloudFormation template to `cdk.out/` |
| `npx cdk diff` | Compare the deployed stack with the current state |

`npx cdk synth` needs no AWS credentials, which makes it the quickest way to check that a change
still produces the template you expect.

## Deployment

Deployments run from `.github/workflows/build-pipeline.yml`, which assumes an AWS role via OIDC
(`ap-southeast-2`) and runs `npm ci && npm run deploy` in this directory on Node 24.

The target environment is derived from the **current git branch**, plus the `ENVIRONMENT`
variable on `main`. The resulting prefix is appended to the stack name and prepended to the
domain:

| Job | Runs when | Prefix | Stack | Domain |
|-----|-----------|--------|-------|--------|
| `deploy-to-dev` | branch is not `main` | the branch name | `VideoDownloaderFrontEndStack-<branch>` | `<branch>.videos.ruchij.com` |
| `deploy-to-staging` | branch is `main` | `staging` | `VideoDownloaderFrontEndStack-staging` | `staging.videos.ruchij.com` |
| `deploy-to-production` | branch is `main`, `ENVIRONMENT=production` | none | `VideoDownloaderFrontEndStack` | `videos.ruchij.com` |

The dev and staging jobs are mutually exclusive — they are gated on `github.ref` — so a push
deploys either a per-branch stack or the staging stack, never both. Because the prefix comes from
the branch, `npx cdk list` reports whatever the checked-out branch would deploy; run it before a
deploy to confirm the target.

The uploaded bundle is keyed per branch and commit (`<branch>/<short-sha>/client.zip`) in the
artifact bucket.
