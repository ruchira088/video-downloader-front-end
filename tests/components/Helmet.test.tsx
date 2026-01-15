import { describe, expect, test, beforeEach } from "vitest"
import { render } from "@testing-library/react"
import Helmet from "~/components/helmet/Helmet"

describe("Helmet", () => {
  beforeEach(() => {
    document.title = "Initial Title"
  })

  test("should set document title on mount", () => {
    render(<Helmet title="Test Page Title" />)
    expect(document.title).toBe("Test Page Title")
  })

  test("should update document title when prop changes", () => {
    const { rerender } = render(<Helmet title="First Title" />)
    expect(document.title).toBe("First Title")

    rerender(<Helmet title="Second Title" />)
    expect(document.title).toBe("Second Title")
  })

  test("should render nothing visible", () => {
    const { container } = render(<Helmet title="Test" />)
    expect(container.innerHTML).toBe("")
  })

  test("should handle empty title", () => {
    render(<Helmet title="" />)
    expect(document.title).toBe("")
  })

  test("should handle special characters in title", () => {
    render(<Helmet title="Test & Special Title" />)
    expect(document.title).toBe("Test & Special Title")
  })
})
