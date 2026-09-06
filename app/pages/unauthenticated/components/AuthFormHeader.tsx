import React, { type FC } from "react"
import smallLogo from "~/images/small-logo.svg"
import styles from "./AuthFormHeader.module.scss"

type AuthFormHeaderProps = {
  readonly subtitle: string
}

/** The logo, product name and a one-line prompt shown above the sign-in and sign-up forms. */
const AuthFormHeader: FC<AuthFormHeaderProps> = ({ subtitle }) => (
  <div className={styles.logoSection}>
    <img src={smallLogo} alt="Video Downloader" className={styles.logo} />
    <h1 className={styles.title}>Video Downloader</h1>
    <p className={styles.subtitle}>{subtitle}</p>
  </div>
)

export default AuthFormHeader
