import SimpleGit from "simple-git"
import { writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { DateTime } from "luxon"

const getGitInformation = async () => {
  try {
    const simpleGit = SimpleGit()

    const gitBranch = await simpleGit.branch()
    const gitCommitHash = await simpleGit.revparse(["--short", "HEAD"])

    return { branch: gitBranch.current, commit: gitCommitHash }
  } catch (error) {
    console.warn(
      `Unable to determine git branch/commit (${error.message ?? error}). Falling back to placeholder values.`
    )

    return { branch: "unknown", commit: "unknown" }
  }
}

const getEnvVariables = async () => {
  const { branch, commit } = await getGitInformation()

  const timestamp = DateTime.now().toISO()

  return [
    {
      name: "VITE_GIT_BRANCH",
      value: branch,
    },
    {
      name: "VITE_GIT_COMMIT",
      value: commit,
    },
    {
      name: "VITE_BUILD_TIMESTAMP",
      value: timestamp,
    }
  ]
}

const writeToEnvFile = async envVariables =>  {
  const envFilePath = resolve(import.meta.dirname, "../.env")
  const envFileContent = envVariables.map(({name, value}) => `${name}="${value}"`).join("\n")

  await writeFile(envFilePath, envFileContent)
}

const main = async () => {
  const envVariables = await getEnvVariables()
  await writeToEnvFile(envVariables)
}

main().catch(error => {
  console.error(`Failed to generate .env file: ${error.message ?? error}`)
  process.exitCode = 1
})