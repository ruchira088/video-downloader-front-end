import React from "react"
import { Route, Routes } from "react-router-dom"
import LoginPage from "../login/LoginPage"

const UnauthenticatedRouter = (props: { onAuthenticationSuccess: () => void }) => (
  <Routes>
    <Route path="/" element={<LoginPage onAuthenticationSuccess={props.onAuthenticationSuccess} />} />
  </Routes>
)

export default UnauthenticatedRouter
