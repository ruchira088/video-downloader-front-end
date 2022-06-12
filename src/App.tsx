import React, { useState } from "react"
import AuthenticatedApp from "./pages/authenticated/AuthenticatedApp"
import { getAuthenticationToken } from "./services/authentication/AuthenticationService"
import UnauthenticatedApp from "./pages/unauthenticated/UnauthenticatedApp"
import moment from "moment"

const App = () => {
  const [isAuthenticated, setAuthenticated] = useState(
    getAuthenticationToken()
      .filter((token) => token.expiresAt.isAfter(moment()))
      .isSome()
  )

  if (isAuthenticated) {
    return <AuthenticatedApp />
  } else {
    return <UnauthenticatedApp onAuthenticationSuccess={() => setAuthenticated(true)} />
  }
}

export default App
