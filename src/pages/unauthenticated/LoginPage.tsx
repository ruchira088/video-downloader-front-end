import React from "react"
import LoginForm from "pages/unauthenticated/components/login-form/LoginForm"
import {AuthenticationToken} from "models/AuthenticationToken"
import styles from "./LoginPage.module.css"

export default ({onAuthenticate}: {onAuthenticate: (token: AuthenticationToken) => void}) => (
    <div className={styles.loginPage}>
        <LoginForm onAuthenticate={onAuthenticate}/>
    </div>
)
