import React from "react"
import SignupForm from "./components/signup-form/SignupForm"
import { useNavigate } from "react-router"
import Helmet from "~/components/helmet/Helmet"

import styles from "./SignupPage.module.scss"

const SignupPage = () => {
  const navigate = useNavigate()

  const onSignup = () => {
    navigate("/")
  }

  return (
    <div className={styles.signupPage}>
      <Helmet title="Sign Up" />
      <SignupForm onSignup={onSignup} />
    </div>
  )
}

export default SignupPage
