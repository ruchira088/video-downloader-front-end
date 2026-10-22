/** The API the suite signs in against. The local build is pointed at the same one. */
export const API_URL = process.env.E2E_API_URL ?? "https://api.staging.video.dev.ruchij.com"

/** Where the setup project saves the signed-in session that the specs start from. */
export const STORAGE_STATE_PATH = "e2e/.auth/user.json"

export type Credentials = {
  readonly email: string
  readonly password: string
}

export const credentials = (): Credentials => {
  const email = process.env.E2E_EMAIL
  const password = process.env.E2E_PASSWORD

  if (!email || !password) {
    throw new Error("Set E2E_EMAIL and E2E_PASSWORD to the staging test account's credentials")
  }

  return { email, password }
}
