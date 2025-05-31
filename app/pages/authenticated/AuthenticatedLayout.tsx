import {Outlet, useNavigate} from "react-router"
import React, {useEffect, useState} from "react"
import type {AuthenticationToken} from "~/models/AuthenticationToken"
import {
  getAuthenticatedUser,
  getAuthenticationToken,
  REDIRECT_QUERY_PARAMETER,
  removeAuthenticationToken
} from "~/services/authentication/AuthenticationService"
import {setSavedSafeMode} from "~/services/Configuration"
import {ApplicationContext, DEFAULT_APPLICATION_CONTEXT} from "~/context/ApplicationContext"
import Header from "~/components/title-bar/Header"
import type {Option} from "~/types/Option"

const AuthenticatedLayout = () => {
  const navigate = useNavigate()
  const [applicationContext, setApplicationContext] = useState(DEFAULT_APPLICATION_CONTEXT)

  const setContext = (applicationContext: ApplicationContext) => {
    setSavedSafeMode(applicationContext.safeMode)
    setApplicationContext(applicationContext)
  }

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
    <ApplicationContext.Provider value={applicationContext}>
      <Header setApplicationContext={setContext} />
      <Outlet />
    </ApplicationContext.Provider>
  )
}

export default AuthenticatedLayout