import React, { type ChangeEvent, type Dispatch, type FC, type SetStateAction, useState } from "react"
import { Button, TextField } from "@mui/material"
import { login } from "~/services/authentication/AuthenticationService"
import { type AuthenticationToken } from "~/models/AuthenticationToken"
import styles from "./LoginForm.module.scss"
import ErrorMessages from "~/components/error-messages/ErrorMessages"

interface Errors {
  email: string | null
  password: string | null
  response: string[]
}

const EMPTY_ERRORS: Errors = { email: null, password: null, response: [] }

type LoginFormProps = {
  onAuthenticate: (token: AuthenticationToken) => void
}

const LoginForm: FC<LoginFormProps> = props => {
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [errors, setErrors] = useState<Errors>(EMPTY_ERRORS)

  const onChange = (callback: Dispatch<SetStateAction<string>>) => (event: ChangeEvent<HTMLInputElement>) => {
    setErrors(EMPTY_ERRORS)
    callback(event.target.value)
  }

  const onLoginClick = async () => {
    const isEmailValid = validateNonEmpty("email", email)
    const isPasswordValid = validateNonEmpty("password", password)

    if (isEmailValid && isPasswordValid) {
      try {
        const authenticationToken = await login(email, password)
        props.onAuthenticate(authenticationToken)
      } catch (error) {
        setErrors(errors => ({
          ...errors,
          response: error as string[] || [],
        }))
      }
    }
  }

  const validateNonEmpty = (field: "email" | "password", value: string) => {
    if (value.trim().length === 0) {
      setErrors(errors => ({ ...errors, [field]: "Cannot be empty" }))
      return false
    } else return true
  }

  return (
    <div className={styles.loginForm}>
      <h1 className={styles.title}>Login</h1>
      <div className={styles.loginFormBody}>
        <div>
          <TextField
            error={errors.email != null}
            value={email}
            onChange={onChange(setEmail)}
            label="Email"
            helperText={errors.email}
            type="email"
            className={styles.textField}
            fullWidth
          />
          <TextField
            error={errors.password != null}
            value={password}
            onChange={onChange(setPassword)}
            helperText={errors.password}
            label="Password"
            type="password"
            className={styles.textField}
            fullWidth
          />
        </div>
        <div className={styles.loginButton}>
          <Button onClick={onLoginClick} variant="contained" color="primary">
            Login
          </Button>
        </div>
      </div>
      <ErrorMessages errors={errors.response} />
    </div>
  )
}

export default LoginForm
