import { describe, expect, test, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import ServerErrorPage from "~/pages/authenticated/server-error/ServerErrorPage"
import React from "react"

vi.mock("~/services/ApiConfiguration", () => ({
  apiConfiguration: {
    baseUrl: "https://api.example.com",
  },
}))

describe("ServerErrorPage", () => {
  test("should render error message with API URL", () => {
    render(<ServerErrorPage />)

    expect(screen.getByText(/Unable to connect to/)).toBeInTheDocument()
    expect(screen.getByText(/https:\/\/api\.example\.com/)).toBeInTheDocument()
  })
})
