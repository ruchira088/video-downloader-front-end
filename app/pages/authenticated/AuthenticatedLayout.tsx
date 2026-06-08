import { Outlet } from "react-router"
import React from "react"
import Header from "~/components/title-bar/Header"
import { useRedirectOnAuth } from "~/pages/useRedirectOnAuth"

const AuthenticatedLayout = () => {
  useRedirectOnAuth(false)

  return (
    <>
      <Header />
      <Outlet />
    </>
  )
}

export default AuthenticatedLayout
