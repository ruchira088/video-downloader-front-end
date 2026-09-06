import React, { type FC, useState } from "react"
import { Button, TextField } from "@mui/material"
import { login } from "~/services/authentication/AuthenticationService"
import { createUser, type CreateUserRequest } from "~/services/user/UserService"
import styles from "./SignupForm.module.scss"
import ErrorMessages from "~/components/error-messages/ErrorMessages"
import { Link } from "react-router"
import { onFieldChange } from "~/pages/unauthenticated/AuthFormHelpers"
import { extractErrorMessages } from "~/utils/ErrorMessages"
import AuthFormHeader from "~/pages/unauthenticated/components/AuthFormHeader"
import PasswordField from "~/pages/unauthenticated/components/PasswordField"

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

  const onChange = onFieldChange(() => setErrors(EMPTY_ERRORS))

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

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isSubmitting) return

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
        const errorMessages = extractErrorMessages(error, { 409: "An account with this email already exists." })
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
      <AuthFormHeader subtitle="Create your account" />
      <form className={styles.signupFormBody} onSubmit={onSubmit} noValidate>
        <div className={styles.nameRow}>
          <TextField
            error={errors.firstName != null}
            value={firstName}
            onChange={onChange(setFirstName)}
            label="First Name"
            helperText={errors.firstName}
            name="firstName"
            autoComplete="given-name"
            className={styles.textField}
            fullWidth
          />
          <TextField
            error={errors.lastName != null}
            value={lastName}
            onChange={onChange(setLastName)}
            label="Last Name"
            helperText={errors.lastName}
            name="lastName"
            autoComplete="family-name"
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
          name="email"
          autoComplete="email"
          className={styles.textField}
          fullWidth
        />
        <PasswordField
          error={errors.password != null}
          value={password}
          onChange={onChange(setPassword)}
          helperText={errors.password}
          label="Password"
          name="password"
          autoComplete="new-password"
          className={styles.textField}
        />
        <PasswordField
          error={errors.confirmPassword != null}
          value={confirmPassword}
          onChange={onChange(setConfirmPassword)}
          helperText={errors.confirmPassword}
          label="Confirm Password"
          name="confirmPassword"
          autoComplete="new-password"
          className={styles.textField}
        />
        <div className={styles.signupButton}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating Account..." : "Sign Up"}
          </Button>
        </div>
      </form>
      <ErrorMessages errors={errors.response} />
      <div className={styles.loginLink}>
        Already have an account? <Link to="/sign-in">Sign in</Link>
      </div>
    </div>
  )
}

export default SignupForm
