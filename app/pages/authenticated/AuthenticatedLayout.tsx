import { Outlet, useNavigate } from "react-router"
import React, { useEffect, useState } from "react"
import type { AuthenticationToken } from "~/models/AuthenticationToken"
import {
  getAuthenticatedUser,
  getAuthenticationToken,
  REDIRECT_QUERY_PARAMETER
} from "~/services/authentication/AuthenticationService"
import { setSavedSafeMode } from "~/services/Configuration"
import { ApplicationContext, DEFAULT_APPLICATION_CONTEXT } from "~/context/ApplicationContext"
import TitleBar from "~/components/title-bar/TitleBar"
import type { Option } from "~/types/Option"

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
    const token: Option<AuthenticationToken> = getAuthenticationToken()

    const redirectUrl = `/sign-in?${REDIRECT_QUERY_PARAMETER}=${window.location.pathname}`

    await token.forEach(async () => {
      try {
        await getAuthenticatedUser()
      } catch (e) {
        navigate(redirectUrl)
      }
    })

    if (token.isEmpty()) {
      navigate(redirectUrl)
    }
  }

  return (
    <ApplicationContext.Provider value={applicationContext}>
      <TitleBar {...applicationContext} setApplicationContext={setContext} />
      <Outlet />
    </ApplicationContext.Provider>
  )
}

export default AuthenticatedLayout