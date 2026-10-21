import React from "react"
import LoginForm from "./components/login-form/LoginForm"
import { useNavigate } from "react-router"
import Helmet from "~/components/helmet/Helmet"
import { safeRedirectPath, useRedirectParameter } from "~/pages/unauthenticated/AuthFormHelpers"

import styles from "./LoginPage.module.scss"

const LoginPage = () => {
  const navigate = useNavigate()
  const redirect = useRedirectParameter()

  const onAuthenticate = () => {
    void navigate(safeRedirectPath(redirect))
  }

  return (
    <div className={styles.loginPage}>
      <Helmet title="Login" />
      <LoginForm onAuthenticate={onAuthenticate} />
    </div>
  )
}

export default LoginPage
