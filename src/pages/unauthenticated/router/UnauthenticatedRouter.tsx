import React from "react"
import { Route, Switch } from "react-router-dom"
import LoginPage from "../login/LoginPage"

const UnauthenticatedRouter = (props: { onAuthenticationSuccess: () => void }) =>
  <Switch>
    <Route exact path="/">
      <LoginPage onAuthenticationSuccess={props.onAuthenticationSuccess}/>
    </Route>
  </Switch>

export default UnauthenticatedRouter