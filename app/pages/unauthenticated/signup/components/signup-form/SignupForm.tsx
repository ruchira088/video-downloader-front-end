import React, { type ChangeEvent, type Dispatch, type FC, type SetStateAction, useState } from "react"
import { Button, TextField } from "@mui/material"
import { login } from "~/services/authentication/AuthenticationService"
import { createUser, type CreateUserRequest } from "~/services/user/UserService"
import styles from "./SignupForm.module.scss"
import ErrorMessages from "~/components/error-messages/ErrorMessages"
import smallLogo from "~/images/small-logo.svg"
import { Link } from "react-router"

interface Errors {
  firstName: string | null
  lastName: string | null
  email: string | null
  password: string | null
  confirmPassword: string | null
  response: string[]
}

const EMPTY_ERRORS: Errors = {
  firstName: null,
  lastName: null,
  email: null,
  password: null,
  confirmPassword: null,
  response: []
}

const extractErrorMessages = (error: unknown): string[] => {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as { response?: { status?: number; data?: { errors?: string[] } } }

    if (axiosError.response?.status === 409) {
      return ["An account with this email already exists."]
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

type SignupFormProps = {
  onSignup: () => void
}

const SignupForm: FC<SignupFormProps> = props => {
  const [firstName, setFirstName] = useState<string>("")
  const [lastName, setLastName] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [confirmPassword, setConfirmPassword] = useState<string>("")
  const [errors, setErrors] = useState<Errors>(EMPTY_ERRORS)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onChange = (callback: Dispatch<SetStateAction<string>>) => (event: ChangeEvent<HTMLInputElement>) => {
    setErrors(EMPTY_ERRORS)
    callback(event.target.value)
  }

  const validateNonEmpty = (field: keyof Omit<Errors, "response">, value: string, label: string): boolean => {
    if (value.trim().length === 0) {
      setErrors(errors => ({ ...errors, [field]: `${label} cannot be empty` }))
      return false
    }
    return true
  }

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      setErrors(errors => ({ ...errors, email: "Please enter a valid email address" }))
      return false
    }
    return true
  }

  const validatePasswordMatch = (): boolean => {
    if (password !== confirmPassword) {
      setErrors(errors => ({ ...errors, confirmPassword: "Passwords do not match" }))
      return false
    }
    return true
  }

  const onSignupClick = async () => {
    const isFirstNameValid = validateNonEmpty("firstName", firstName, "First name")
    const isLastNameValid = validateNonEmpty("lastName", lastName, "Last name")
    const isEmailNonEmpty = validateNonEmpty("email", email, "Email")
    const isEmailValid = isEmailNonEmpty && validateEmail(email)
    const isPasswordValid = validateNonEmpty("password", password, "Password")
    const isConfirmPasswordValid = validateNonEmpty("confirmPassword", confirmPassword, "Confirm password")
    const doPasswordsMatch = isPasswordValid && isConfirmPasswordValid && validatePasswordMatch()

    if (isFirstNameValid && isLastNameValid && isEmailValid && doPasswordsMatch) {
      setIsSubmitting(true)
      try {
        const createUserRequest: CreateUserRequest = { firstName, lastName, email, password }
        await createUser(createUserRequest)
        await login(email, password)
        props.onSignup()
      } catch (error: unknown) {
        const errorMessages = extractErrorMessages(error)
        setErrors(errors => ({
          ...errors,
          response: errorMessages,
        }))
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <div className={styles.signupForm}>
      <div className={styles.logoSection}>
        <img src={smallLogo} alt="Video Downloader" className={styles.logo} />
        <h1 className={styles.title}>Video Downloader</h1>
        <p className={styles.subtitle}>Create your account</p>
      </div>
      <div className={styles.signupFormBody}>
        <div className={styles.nameRow}>
          <TextField
            error={errors.firstName != null}
            value={firstName}
            onChange={onChange(setFirstName)}
            label="First Name"
            helperText={errors.firstName}
            className={styles.textField}
            fullWidth
          />
          <TextField
            error={errors.lastName != null}
            value={lastName}
            onChange={onChange(setLastName)}
            label="Last Name"
            helperText={errors.lastName}
            className={styles.textField}
            fullWidth
          />
        </div>
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
        <TextField
          error={errors.confirmPassword != null}
          value={confirmPassword}
          onChange={onChange(setConfirmPassword)}
          helperText={errors.confirmPassword}
          label="Confirm Password"
          type="password"
          className={styles.textField}
          fullWidth
        />
        <div className={styles.signupButton}>
          <Button
            onClick={onSignupClick}
            variant="contained"
            color="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating Account..." : "Sign Up"}
          </Button>
        </div>
      </div>
      <ErrorMessages errors={errors.response} />
      <div className={styles.loginLink}>
        Already have an account? <Link to="/sign-in">Sign in</Link>
      </div>
    </div>
  )
}

export default SignupForm
