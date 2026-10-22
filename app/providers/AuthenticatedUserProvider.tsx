import React from "react"
import { Role, type User } from "~/models/User"
import { None, type Option } from "~/types/Option"

/**
 * The signed-in user, as confirmed by the session check in `AuthenticatedLayout`.
 *
 * Defaults to `None`, so anything rendered outside the authenticated layout (a test harness, a
 * public page) is treated as a non-admin: admin-only controls fail closed.
 */
export const AuthenticatedUserContext = React.createContext<Option<User>>(None.of())

export const useAuthenticatedUser = (): Option<User> => React.useContext(AuthenticatedUserContext)

export const useIsAdmin = (): boolean =>
  useAuthenticatedUser().map(user => user.role === Role.Admin).getOrElse(() => false)
