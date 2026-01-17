import React, { type ChangeEvent, type Dispatch, type FC, type SetStateAction, useState } from "react"
import { Button, TextField, InputAdornment, IconButton } from "@mui/material"
import Visibility from "@mui/icons-material/Visibility"
import VisibilityOff from "@mui/icons-material/VisibilityOff"
import { login } from "~/services/authentication/AuthenticationService"
import { type AuthenticationToken } from "~/models/AuthenticationToken"
import styles from "./LoginForm.module.scss"
import ErrorMessages from "~/components/error-messages/ErrorMessages"
import smallLogo from "~/images/small-logo.svg"
import { Link } from "react-router"

interface Errors {
  email: string | null
  password: string | null
  response: string[]
}

const EMPTY_ERRORS: Errors = { email: null, password: null, response: [] }

const extractErrorMessages = (error: unknown): string[] => {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as { response?: { status?: number; data?: { errors?: string[] } } }

    if (axiosError.response?.status === 401) {
      return ["Invalid email or password. Please try again."]
    }

    if (axiosError.response?.data?.errors && Array.isArray(axiosError.response.data.errors)) {
      return axiosError.response.data.errors
    }
  }

  if (error instanceof Error) {
    return [error.message]
  }

  return ["An unexpected error occurred. Please try again."]
}

type LoginFormProps = {
  onAuthenticate: (token: AuthenticationToken) => void
}

const LoginForm: FC<LoginFormProps> = props => {
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [showPassword, setShowPassword] = useState(false)
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
      } catch (error: unknown) {
        const errorMessages = extractErrorMessages(error)
        setErrors(errors => ({
          ...errors,
          response: errorMessages,
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
      <div className={styles.logoSection}>
        <img src={smallLogo} alt="Video Downloader" className={styles.logo} />
        <h1 className={styles.title}>Video Downloader</h1>
        <p className={styles.subtitle}>Sign in to your account</p>
      </div>
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
            type={showPassword ? "text" : "password"}
            className={styles.textField}
            fullWidth
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
          />
        </div>
        <div className={styles.loginButton}>
          <Button onClick={onLoginClick} variant="contained" color="primary">
            Login
          </Button>
        </div>
      </div>
      <ErrorMessages errors={errors.response} />
      <div className={styles.signupLink}>
        Don't have an account? <Link to="/sign-up">Sign up</Link>
      </div>
    </div>
  )
}

export default LoginForm
