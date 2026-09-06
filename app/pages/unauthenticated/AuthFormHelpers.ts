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
