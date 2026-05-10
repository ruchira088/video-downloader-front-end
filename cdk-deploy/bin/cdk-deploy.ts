#!/usr/bin/env node
import { deployReactSpa } from "react-app-cdk-deploy"

deployReactSpa({
  stackName: "VideoDownloaderFrontEndStack",
  domainName: "videos.ruchij.com",
  artifactBucket: "video-downloader-front-end-bundles.ruchij.com"
}).catch((error) => {
  console.error(error)
  process.exit(1)
})
