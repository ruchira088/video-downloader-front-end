import React from "react"
import LoginForm from "pages/unauthenticated/login/components/login-form/LoginForm"
import styles from "./LoginPage.module.css"

const LoginPage = (props: { onAuthenticationSuccess: () => void }) => {
  return (
    <div className={styles.loginPage}>
      <LoginForm onAuthenticate={props.onAuthenticationSuccess} />
    </div>
  )
}

export default LoginPage