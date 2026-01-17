import React, { type FC } from "react"
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline"
import styles from "./ErrorMessages.module.scss"

type ErrorMessagesProps = {
  readonly errors: string[]
  readonly title?: string
}

const ErrorMessages: FC<ErrorMessagesProps> = ({ errors, title = "Authentication failed" }) => {
  if (errors.length === 0) return null

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorHeader}>
        <ErrorOutlineIcon className={styles.errorIcon} />
        <p className={styles.errorTitle}>{title}</p>
      </div>
      {errors.length === 1 ? (
        <p className={styles.singleError}>{errors[0]}</p>
      ) : (
        <ul className={styles.errorList}>
          {errors.map((error, index) => (
            <li key={index} className={styles.errorItem}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ErrorMessages