import React from "react"
import UnauthenticatedRouter from "./router/UnauthenticatedRouter"
import { BrowserRouter as Router } from "react-router-dom"

const UnauthenticatedApp =
  (props: { onAuthenticationSuccess: () => void }) =>
    <div>
      <Router>
        <UnauthenticatedRouter onAuthenticationSuccess={props.onAuthenticationSuccess}/>
      </Router>
    </div>

export default UnauthenticatedApp