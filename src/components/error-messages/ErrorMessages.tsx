import React from "react"

const ErrorMessage = ({ error }: { error: string }) => <div>{error}</div>

const ErrorMessages = ({ errors }: { errors: string[] }) => (
  <div>
    {errors.map((error, index) => (
      <ErrorMessage error={error} key={index} />
    ))}
  </div>
)

export default ErrorMessages