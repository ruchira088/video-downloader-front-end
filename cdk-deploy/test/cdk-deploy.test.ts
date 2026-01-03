import { Template } from "aws-cdk-lib/assertions"
import { App } from "aws-cdk-lib/core"
import { VideoDownloaderFrontEndStack } from "../lib/VideoDownloaderFrontEndStack"

test("S3 Bucket Created", () => {
  const app = new App()

  // WHEN
  const stack = new VideoDownloaderFrontEndStack(
    app,
    "MyTestStack",
    "test.ruchij.com",
    {
      bucketName: "test-bucket",
      zipObjectKey: "test-key.zip"
    },
    {
      env: { account: "123456789012", region: "us-east-1" }
    }
  )

  // THEN
  const template = Template.fromStack(stack)

  template.hasResourceProperties("AWS::S3::Bucket", {
    BucketName: "test.ruchij.com"
  })
});
