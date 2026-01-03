#!/usr/bin/env node
import { App } from "aws-cdk-lib/core"
import { VideoDownloaderFrontEndStack } from "../lib/VideoDownloaderFrontEndStack"
import SimpleGit from "simple-git"

const S3_DATA_BUNDLES = "video-downloader-front-end-bundles.ruchij.com"
const DOMAIN_NAME = "videos.ruchij.com"
const STACK_NAME = "VideoDownloaderFrontEndStack"

const getPrefix = (gitBranch: string): string | null => {
  if (gitBranch === "main") {
    if (process.env.ENVIRONMENT === "production") {
      return null
    } else {
      return "staging"
    }
  } else {
    return gitBranch
  }
}

const main = async () => {
  const app = new App()

  const simpleGit = SimpleGit()

  const gitBranch = await simpleGit.branch()
  const gitCommitHash = await simpleGit.revparse(["--short", "HEAD"])
  const zipObjectKey = `${gitBranch.current}/${gitCommitHash}/client.zip`

  const prefix: string | null = getPrefix(gitBranch.current)

  if (prefix != null) {
    console.log(`Deploying with prefix: "${prefix}"`)
  } else {
    console.log("Deploying to production")
  }

  new VideoDownloaderFrontEndStack(
    app,
    [STACK_NAME, prefix].filter(value => value != null).join("-"),
    [prefix, DOMAIN_NAME].filter(value => value != null).join("."),
    {
      bucketName: S3_DATA_BUNDLES,
      zipObjectKey
    },
    {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: "us-east-1"
      }
    }
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
