import React from "react"
import LoginForm from "./components/login-form/LoginForm"
import { useNavigate, useSearchParams } from "react-router"
import { REDIRECT_QUERY_PARAMETER } from "~/services/authentication/AuthenticationService"

import styles from "./LoginPage.module.scss"

const LoginPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const onAuthenticate = () => {
    const redirect: string | null = searchParams.get(REDIRECT_QUERY_PARAMETER)

    const nextUrl = redirect || "/home"
    navigate(nextUrl)
  }

  return (
    <div className={styles.loginPage}>
      <LoginForm onAuthenticate={onAuthenticate} />
    </div>
  )
}

export default LoginPage
