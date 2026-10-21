import { type ChangeEvent, type Dispatch, type SetStateAction } from "react"
import { useSearchParams } from "react-router"
import { Option } from "~/types/Option"
import { Either } from "~/types/Either"
import { REDIRECT_QUERY_PARAMETER } from "~/services/authentication/AuthenticationService"

/**
 * Whether `path` stays on this origin once the browser resolves it. A pattern check is not
 * enough: browsers treat `\` as `/` and strip tabs and newlines, so `/\evil.example`
 * becomes the protocol-relative `//evil.example`.
 */
const isInAppPath = (path: string): boolean =>
  path.startsWith("/") &&
  Either.fromTry(() => new URL(path, window.location.origin))
    .fold(() => false, (url) => url.origin === window.location.origin)

/**
 * Restricts a post-authentication redirect target to in-app paths, so absolute
 * (`https://evil.example`) and protocol-relative (`//evil.example`, `/\evil.example`)
 * URLs fall back to the home page.
 */
export const safeRedirectPath = (redirect: Option<string>): string =>
  redirect.filter(isInAppPath).getOrElse(() => "/")

/** The page to return to after signing in or up, as passed to the current auth page. */
export const useRedirectParameter = (): Option<string> => {
  const [searchParams] = useSearchParams()
  return Option.fromNullable(searchParams.get(REDIRECT_QUERY_PARAMETER))
}

/** Links between the auth pages carry the return page along, so switching pages doesn't lose it. */
export const withRedirectParameter = (path: string, redirect: Option<string>): string =>
  redirect.fold(
    () => path,
    (target) => `${path}?${new URLSearchParams({ [REDIRECT_QUERY_PARAMETER]: target }).toString()}`
  )

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
