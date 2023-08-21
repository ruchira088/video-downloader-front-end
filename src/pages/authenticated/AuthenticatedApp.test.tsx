import React from "react"
import { render } from "@testing-library/react"
import "@testing-library/jest-dom"
import AuthenticatedApp from "./AuthenticatedApp"

test("renders learn react link", () => {
  const { getByText } = render(<AuthenticatedApp />)
  const linkElement = getByText(/pending/i)
  expect(linkElement).toBeInTheDocument()
})
