import { type ChangeEvent, type Dispatch, type SetStateAction } from "react"
import { type Option } from "~/types/Option"

const IN_APP_PATH_PATTERN = /^\/(?!\/)/

/**
 * Restricts a post-authentication redirect target to in-app paths: a single leading
 * slash (no absolute URLs like `https://evil.example`, no protocol-relative URLs like
 * `//evil.example`). Anything else falls back to the home page.
 */
export const safeRedirectPath = (redirect: Option<string>): string =>
  redirect.filter((path) => IN_APP_PATH_PATTERN.test(path)).getOrElse(() => "/")

/**
 * Extracts user-facing error messages from an unknown (typically axios) error.
 * `statusMessages` maps a response status code to a friendly message that takes
 * precedence over the API-provided errors (e.g. 401 -> "Invalid email or password").
 */
export const extractErrorMessages = (error: unknown, statusMessages: Record<number, string> = {}): string[] => {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as { response?: { status?: number; data?: { errors?: string[] } } }
    const status = axiosError.response?.status

    if (status != null && statusMessages[status] != null) {
      return [statusMessages[status]]
    }

    if (axiosError.response?.data?.errors && Array.isArray(axiosError.response.data.errors)) {
      return axiosError.response.data.errors
    }
  }

  if (error instanceof Error) {
    return [error.message]
  }

  return ["An unexpected error occurred. Please try again."]
}

/**
 * Builds a text-field change handler that resets validation errors and stores the new value.
 * Usage: `const onChange = onFieldChange(() => setErrors(EMPTY_ERRORS))` then `onChange(setEmail)`.
 */
export const onFieldChange =
  (resetErrors: () => void) =>
  (setValue: Dispatch<SetStateAction<string>>) =>
  (event: ChangeEvent<HTMLInputElement>) => {
    resetErrors()
    setValue(event.target.value)
  }
