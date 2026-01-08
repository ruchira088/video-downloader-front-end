import { describe, expect, test } from "vitest"
import { render, screen } from "@testing-library/react"
import ErrorMessages from "~/components/error-messages/ErrorMessages"

describe("ErrorMessages", () => {
  test("should render empty container when no errors", () => {
    const { container } = render(<ErrorMessages errors={[]} />)

    // Should have a container div but no error messages inside
    expect(container.firstChild).toBeInTheDocument()
    expect(container.firstChild?.childNodes.length).toBe(0)
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

  test("should render correct number of error elements", () => {
    const errors = ["Error A", "Error B", "Error C", "Error D"]
    const { container } = render(<ErrorMessages errors={errors} />)

    // Get the ErrorMessages container div and check its direct children
    const errorMessagesContainer = container.firstChild as HTMLElement
    expect(errorMessagesContainer.children.length).toBe(4)
  })

  test("should render errors in correct order", () => {
    const errors = ["First error", "Second error", "Third error"]
    const { container } = render(<ErrorMessages errors={errors} />)

    // Get the ErrorMessages container div and check its direct children
    const errorMessagesContainer = container.firstChild as HTMLElement
    const children = errorMessagesContainer.children
    expect(children[0]).toHaveTextContent("First error")
    expect(children[1]).toHaveTextContent("Second error")
    expect(children[2]).toHaveTextContent("Third error")
  })

  test("should handle errors with special characters", () => {
    const errors = [
      "Error with <html> tags",
      "Error with 'quotes'",
      'Error with "double quotes"',
      "Error with & ampersand",
    ]
    render(<ErrorMessages errors={errors} />)

    expect(screen.getByText("Error with <html> tags")).toBeInTheDocument()
    expect(screen.getByText("Error with 'quotes'")).toBeInTheDocument()
    expect(screen.getByText('Error with "double quotes"')).toBeInTheDocument()
    expect(screen.getByText("Error with & ampersand")).toBeInTheDocument()
  })

  test("should handle very long error messages", () => {
    const longError = "A".repeat(500)
    render(<ErrorMessages errors={[longError]} />)

    expect(screen.getByText(longError)).toBeInTheDocument()
  })

  test("should handle empty string errors", () => {
    const { container } = render(<ErrorMessages errors={["", "Valid error", ""]} />)

    // Get the ErrorMessages container div and check its direct children
    const errorMessagesContainer = container.firstChild as HTMLElement
    expect(errorMessagesContainer.children.length).toBe(3)
    expect(screen.getByText("Valid error")).toBeInTheDocument()
  })
})
