import React, { useEffect } from "react"
import { Outlet, useNavigate } from "react-router"
import { getAuthenticatedUser, getAuthenticationToken } from "~/services/authentication/AuthenticationService"
import type { AuthenticationToken } from "~/models/AuthenticationToken"

const UnauthenticatedLayout = () => {
  const navigate = useNavigate()

  useEffect(() => {
    checkAuthentication()
  }, [])

  const checkAuthentication = async () => {
    const token: AuthenticationToken | null = getAuthenticationToken()

    if (token) {
      try {
        await getAuthenticatedUser()
        navigate("/home")
      } catch (e) {
      }
    }
  }

  return <Outlet />
}

export default UnauthenticatedLayout