import React from "react"
import { Outlet } from "react-router"
import { useRedirectOnAuth } from "~/pages/useRedirectOnAuth"

const UnauthenticatedLayout = () => {
  useRedirectOnAuth(true)

  return <Outlet />
}

export default UnauthenticatedLayout
