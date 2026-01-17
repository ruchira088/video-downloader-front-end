import { describe, expect, test } from "vitest"
import { render, screen } from "@testing-library/react"
import ErrorMessages from "~/components/error-messages/ErrorMessages"

describe("ErrorMessages", () => {
  test("should render nothing when no errors", () => {
    const { container } = render(<ErrorMessages errors={[]} />)

    // Should return null, so container should be empty
    expect(container.firstChild).toBeNull()
  })

  test("should render single error message", () => {
    render(<ErrorMessages errors={["Something went wrong"]} />)

    expect(screen.getByText("Something went wrong")).toBeInTheDocument()
  })

  test("should render multiple error messages", () => {
    const errors = ["Error 1", "Error 2", "Error 3"]
    render(<ErrorMessages errors={errors} />)

    expect(screen.getByText("Error 1")).toBeInTheDocument()
    expect(screen.getByText("Error 2")).toBeInTheDocument()
    expect(screen.getByText("Error 3")).toBeInTheDocument()
  })

  test("should render default title", () => {
    render(<ErrorMessages errors={["Some error"]} />)

    expect(screen.getByText("Authentication failed")).toBeInTheDocument()
  })

  test("should render custom title", () => {
    render(<ErrorMessages errors={["Some error"]} title="Custom Error Title" />)

    expect(screen.getByText("Custom Error Title")).toBeInTheDocument()
  })

  test("should render errors in correct order", () => {
    const errors = ["First error", "Second error", "Third error"]
    render(<ErrorMessages errors={errors} />)

    const listItems = screen.getAllByRole("listitem")
    expect(listItems[0]).toHaveTextContent("First error")
    expect(listItems[1]).toHaveTextContent("Second error")
    expect(listItems[2]).toHaveTextContent("Third error")
  })

  test("should handle errors with special characters", () => {
    const errors = [
      "Error with <html lang='en'> tags",
      "Error with 'quotes'",
      'Error with "double quotes"',
      "Error with & ampersand",
    ]
    render(<ErrorMessages errors={errors} />)

    expect(screen.getByText("Error with <html lang='en'> tags")).toBeInTheDocument()
    expect(screen.getByText("Error with 'quotes'")).toBeInTheDocument()
    expect(screen.getByText('Error with "double quotes"')).toBeInTheDocument()
    expect(screen.getByText("Error with & ampersand")).toBeInTheDocument()
  })

  test("should handle very long error messages", () => {
    const longError = "A".repeat(500)
    render(<ErrorMessages errors={[longError]} />)

    expect(screen.getByText(longError)).toBeInTheDocument()
  })

  test("should render single error without list", () => {
    render(<ErrorMessages errors={["Single error"]} />)

    // Single error should not be in a list
    expect(screen.queryByRole("list")).not.toBeInTheDocument()
    expect(screen.getByText("Single error")).toBeInTheDocument()
  })

  test("should render multiple errors in a list", () => {
    render(<ErrorMessages errors={["Error 1", "Error 2"]} />)

    // Multiple errors should be in a list
    expect(screen.getByRole("list")).toBeInTheDocument()
    expect(screen.getAllByRole("listitem")).toHaveLength(2)
  })
})
