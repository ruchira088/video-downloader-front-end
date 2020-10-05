import React, { ChangeEvent, useState } from "react"
import { Button, TextField } from "@material-ui/core"
import { login } from "services/authentication/AuthenticationService"
import { AuthenticationToken } from "models/AuthenticationToken"
import styles from "./LoginForm.module.css"
import ErrorMessages from "components/error-messages/ErrorMessages"

export default ({ onAuthenticate }: { onAuthenticate: (token: AuthenticationToken) => void }) => {
  const [password, setPassword] = useState<string>("")
  const [errorMessages, setErrorMessages] = useState<string[]>([])

  const onPasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setErrorMessages([])
    setPassword(event.target.value)
  }

  const onLoginClick = () =>
    login(password)
      .then(onAuthenticate)
      .catch((error) => setErrorMessages(error?.response?.data?.errorMessages || []))

  return (
    <div className={styles.loginForm}>
      <div className={styles.loginFormBody}>
        <div>
          <TextField value={password} onChange={onPasswordChange} label="Password" type="password" fullWidth />
        </div>
        <div className={styles.loginButton}>
          <Button onClick={onLoginClick} variant="contained" color="primary">
            Login
          </Button>
        </div>
      </div>
      <ErrorMessages errors={errorMessages} />
    </div>
  )
}
