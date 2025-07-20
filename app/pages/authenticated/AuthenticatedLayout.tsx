import { Outlet, useNavigate } from "react-router"
import React, { useEffect } from "react"
import type { AuthenticationToken } from "~/models/AuthenticationToken"
import {
  getAuthenticatedUser,
  getAuthenticationToken,
  REDIRECT_QUERY_PARAMETER,
  removeAuthenticationToken
} from "~/services/authentication/AuthenticationService"
import Header from "~/components/title-bar/Header"
import type { Option } from "~/types/Option"

const AuthenticatedLayout = () => {
  const navigate = useNavigate()

  useEffect(() => {
    checkAuthentication()
  }, [])

  const checkAuthentication = async () => {
    const maybeToken: Option<AuthenticationToken> = getAuthenticationToken()

    const redirectUrl = `/sign-in?${REDIRECT_QUERY_PARAMETER}=${window.location.pathname}`

    maybeToken.fold(
      () => {
        console.debug("Redirecting to sign-in page.")
        navigate(redirectUrl)
      },
      async _ => {
        try {
          await getAuthenticatedUser()
        } catch (e) {
          removeAuthenticationToken()
          console.debug("Removing authentication token and redirecting to sign-in page.")
          navigate(redirectUrl)
        }
      }
    )
  }

  return (
    <>
      <Header />
      <Outlet />
    </>
  )
}

export default AuthenticatedLayout