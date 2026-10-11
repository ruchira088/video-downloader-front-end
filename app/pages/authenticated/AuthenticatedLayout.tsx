import { Outlet } from "react-router"
import React from "react"
import Header from "~/components/title-bar/Header"
import { SessionStatus, useRedirectOnAuth } from "~/pages/useRedirectOnAuth"
import { LoadingScreen } from "~/components/loading/LoadingScreen"
import { apiConfiguration } from "~/services/ApiConfiguration"
import styles from "./AuthenticatedLayout.module.scss"

const AuthenticatedLayout = () => {
  const { status, retry } = useRedirectOnAuth(false)

  // Children must not mount before the session check completes: their on-mount API
  // calls would 401 and race the redirect to the sign-in page.
  switch (status) {
    case SessionStatus.Verifying:
      return <LoadingScreen />

    case SessionStatus.Unreachable:
      return (
        <main className="error-screen">
          <h1 className="error-title">Unable to connect</h1>
          <p className="error-details">Couldn't reach {apiConfiguration.baseUrl} to verify your session.</p>
          <button type="button" className="error-home-link" onClick={retry}>Retry</button>
        </main>
      )

    case SessionStatus.Verified:
      return (
        <>
          <Header />
          <div className={styles.content}>
            <Outlet />
          </div>
        </>
      )
  }
}

export default AuthenticatedLayout
