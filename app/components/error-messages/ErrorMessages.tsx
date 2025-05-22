import React, { type FC } from "react"

type ErrorMessageProps = {
  readonly error: string
}

const ErrorMessage: FC<ErrorMessageProps> = props => <div>{props.error}</div>

type ErrorMessagesProps = {
  readonly errors: string[]
}

const ErrorMessages: FC<ErrorMessagesProps> = props => (
  <div>
    {props.errors.map((error, index) => (
      <ErrorMessage error={error} key={index} />
    ))}
  </div>
)

export default ErrorMessages