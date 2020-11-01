const { readFile, writeFile } = require("fs")
const { promisify } = require("util")
const path = require("path")
const simpleGit = require("simple-git")

const PROD_BRANCH = "master"
const DEV_BRANCH = "dev"

const SNAPSHOT = "SNAPSHOT"

const git = new simpleGit()

const packageJsonPath = path.resolve(__dirname, "../", "package.json")

const retrievePackageJson = () => promisify(readFile)(packageJsonPath, "utf8").then(JSON.parse)

const updatePackageJson = (json) =>
  retrievePackageJson()
    .then((packageJson) => ({ ...packageJson, ...json }))
    .then((packageJson) => promisify(writeFile)(packageJsonPath, JSON.stringify(packageJson, null, 2)))

const createProductionVersion = (appVersion) => appVersion.replace(`-${SNAPSHOT}`, "")

const incrementVersion = (appVersion) => {
  const [major, minor, patch] = appVersion.split(".").map((value) => parseInt(value, 10))

  return [major, minor, patch + 1].join(".")
}

const createSnapshotVersion = (appVersion) => (appVersion.endsWith(SNAPSHOT) ? appVersion : `${appVersion}-${SNAPSHOT}`)

const createVersion = () =>
  git
    .branch()
    .then((branch) => {
      if (branch.current === DEV_BRANCH) {
        return Promise.resolve()
      } else {
        return Promise.reject(`Current branch is not ${DEV_BRANCH}`)
      }
    })
    .then(() => retrievePackageJson())
    .then((json) => createProductionVersion(json.version))
    .then((version) =>
      updatePackageJson({ version })
        .then(() => git.add(packageJsonPath))
        .then(() => git.commit(`Creating version ${version}`))
        .then(() => git.push())
        .then(() => git.addTag(version))
        .then(() => git.pushTags())
        .then(() => git.checkout(PROD_BRANCH))
        .then(() => git.raw("merge", version))
        .then(() => git.push())
        .then(() => git.checkout(DEV_BRANCH))
    )
    .then(() => retrievePackageJson())
    .then((json) => createSnapshotVersion(incrementVersion(json.version)))
    .then((version) =>
      updatePackageJson({ version })
        .then(() => git.add(packageJsonPath))
        .then(() => git.commit(`Incrementing version to ${version}`))
        .then(() => git.push())
        .then(() => version)
    )

createVersion().then(console.log)
