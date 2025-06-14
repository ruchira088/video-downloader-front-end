import React from "react"
import LoginForm from "./components/login-form/LoginForm"
import { useNavigate, useSearchParams } from "react-router"
import Helmet from "~/components/helmet/Helmet"
import { Option } from "~/types/Option"
import { REDIRECT_QUERY_PARAMETER } from "~/services/authentication/AuthenticationService"

import styles from "./LoginPage.module.scss"

const LoginPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const onAuthenticate = () => {
    const redirect: Option<string> = Option.fromNullable(searchParams.get(REDIRECT_QUERY_PARAMETER))

    const nextUrl = redirect.getOrElse(() => "/")
    navigate(nextUrl)
  }

  return (
    <div className={styles.loginPage}>
      <Helmet title="Login" />
      <LoginForm onAuthenticate={onAuthenticate} />
    </div>
  )
}

export default LoginPage
