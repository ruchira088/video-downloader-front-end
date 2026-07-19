import { Outlet } from "react-router"
import React, { type ReactNode } from "react"
import Header from "~/components/title-bar/Header"
import { useRedirectOnAuth } from "~/pages/useRedirectOnAuth"
import { LoadableComponent } from "~/components/hoc/loading/LoadableComponent"
import { None, Some } from "~/types/Option"

const AuthenticatedLayout = () => {
  const isVerified = useRedirectOnAuth(false)

  // Children must not mount before the session check completes: their on-mount API
  // calls would 401 and race the redirect to the sign-in page.
  return (
    <LoadableComponent>
      {
        isVerified
          ? Some.of<ReactNode>(
            <>
              <Header />
              <Outlet />
            </>
          )
          : None.of<ReactNode>()
      }
    </LoadableComponent>
  )
}

export default AuthenticatedLayout
