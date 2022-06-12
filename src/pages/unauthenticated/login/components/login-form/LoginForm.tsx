import React, { ChangeEvent, Dispatch, SetStateAction, useState } from "react"
import { Button, TextField } from "@material-ui/core"
import { login } from "services/authentication/AuthenticationService"
import { AuthenticationToken } from "models/AuthenticationToken"
import styles from "./LoginForm.module.css"
import ErrorMessages from "components/error-messages/ErrorMessages"
import { Maybe, None, Some } from "monet"

interface Errors {
  email: Maybe<string>
  password: Maybe<string>
  response: Maybe<string>
}

const EMPTY_ERRORS: Errors = { email: None(), password: None(), response: None() }

const LoginForm = ({ onAuthenticate }: { onAuthenticate: (token: AuthenticationToken) => void }) => {
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [errors, setErrors] = useState<Errors>(EMPTY_ERRORS)

  const onChange = (callback: Dispatch<SetStateAction<string>>) => (event: ChangeEvent<HTMLInputElement>) => {
    setErrors(EMPTY_ERRORS)
    callback(event.target.value)
  }

  const onLoginClick = () => {
    const isEmailValid = validateNonEmpty("email", email)
    const isPasswordValid = validateNonEmpty("password", password)

    if (isEmailValid && isPasswordValid) {
      login(email, password)
        .then(onAuthenticate)
        .catch((error) =>
          setErrors((errors) => ({
            ...errors,
            response: Some(error?.response?.data?.errorMessages || []),
          }))
        )
    }
  }

  const validateNonEmpty = (field: "email" | "password", value: string) => {
    if (value.trim().length === 0) {
      setErrors((errors) => ({ ...errors, [field]: Some("Cannot be empty") }))
      return false
    } else return true
  }

  return (
    <div className={styles.loginForm}>
      <div className={styles.loginFormBody}>
        <div>
          <TextField
            error={errors.email.isSome()}
            value={email}
            onChange={onChange(setEmail)}
            label="Email"
            helperText={errors.email.getOrElse("")}
            type="email"
            fullWidth
          />
          <TextField
            error={errors.password.isSome()}
            value={password}
            onChange={onChange(setPassword)}
            helperText={errors.password.getOrElse("")}
            label="Password"
            type="password"
            fullWidth
          />
        </div>
        <div className={styles.loginButton}>
          <Button onClick={onLoginClick} variant="contained" color="primary">
            Login
          </Button>
        </div>
      </div>
      <ErrorMessages errors={errors.response.fold<string[]>([])((error) => [error])} />
    </div>
  )
}

export default LoginForm
