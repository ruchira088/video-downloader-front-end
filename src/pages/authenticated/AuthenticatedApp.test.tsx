import React from "react"
import { render } from "@testing-library/react"
import App from "./AuthenticatedApp"

test("renders learn react link", () => {
  const { getByText } = render(<App />)
  const linkElement = getByText(/pending/i)
  expect(linkElement).toBeInTheDocument()
})
