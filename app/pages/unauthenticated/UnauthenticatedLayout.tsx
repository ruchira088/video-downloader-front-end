import React, { useEffect } from "react"
import { Outlet, useNavigate } from "react-router"
import { getAuthenticatedUser, getAuthenticationToken } from "~/services/authentication/AuthenticationService"
import type { AuthenticationToken } from "~/models/AuthenticationToken"
import type { Option } from "~/types/Option"

const UnauthenticatedLayout = () => {
  const navigate = useNavigate()

  useEffect(() => {
    checkAuthentication()
  }, [])

  const checkAuthentication = () => {
    const token: Option<AuthenticationToken> = getAuthenticationToken()

    token.forEach(async () => {
      try {
        const user = await getAuthenticatedUser()
        navigate("/")
      } catch (e) {
      }
    })
  }

  return <Outlet />
}

export default UnauthenticatedLayout