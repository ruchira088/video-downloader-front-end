import { describe, expect, test } from "vitest"
import { render, screen } from "@testing-library/react"
import { LoadableComponent } from "~/components/hoc/loading/LoadableComponent"
import { Some, None } from "~/types/Option"

describe("LoadableComponent", () => {
  describe("Loading State (None)", () => {
    test("should render default CircularProgress when children is None", () => {
      render(<LoadableComponent children={None.of()} />)

      // MUI CircularProgress renders with role="progressbar"
      expect(screen.getByRole("progressbar")).toBeInTheDocument()
    })

    test("should render custom loading component when provided", () => {
      const customLoader = <div data-testid="custom-loader">Loading...</div>
      render(
        <LoadableComponent children={None.of()} loadingComponent={customLoader} />
      )

      expect(screen.getByTestId("custom-loader")).toBeInTheDocument()
      expect(screen.getByText("Loading...")).toBeInTheDocument()
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()
    })

    test("should render string as loading component", () => {
      render(<LoadableComponent children={None.of()} loadingComponent="Please wait..." />)

      expect(screen.getByText("Please wait...")).toBeInTheDocument()
    })
  })

  describe("Loaded State (Some)", () => {
    test("should render children when children is Some", () => {
      const content = <div data-testid="content">Loaded Content</div>
      render(<LoadableComponent children={Some.of(content)} />)

      expect(screen.getByTestId("content")).toBeInTheDocument()
      expect(screen.getByText("Loaded Content")).toBeInTheDocument()
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()
    })

    test("should render string children", () => {
      render(<LoadableComponent children={Some.of("Just a string")} />)

      expect(screen.getByText("Just a string")).toBeInTheDocument()
    })

    test("should render number children", () => {
      render(<LoadableComponent children={Some.of(42)} />)

      expect(screen.getByText("42")).toBeInTheDocument()
    })

    test("should render complex children", () => {
      const complexContent = (
        <div>
          <h1>Title</h1>
          <p>Paragraph content</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </div>
      )
      render(<LoadableComponent children={Some.of(complexContent)} />)

      expect(screen.getByRole("heading", { name: "Title" })).toBeInTheDocument()
      expect(screen.getByText("Paragraph content")).toBeInTheDocument()
      expect(screen.getByText("Item 1")).toBeInTheDocument()
      expect(screen.getByText("Item 2")).toBeInTheDocument()
    })

    test("should ignore loadingComponent when children is Some", () => {
      const content = <div data-testid="content">Real Content</div>
      const loader = <div data-testid="loader">Loader</div>
      render(
        <LoadableComponent children={Some.of(content)} loadingComponent={loader} />
      )

      expect(screen.getByTestId("content")).toBeInTheDocument()
      expect(screen.queryByTestId("loader")).not.toBeInTheDocument()
    })
  })

  describe("className prop", () => {
    test("should apply className to container div", () => {
      const { container } = render(
        <LoadableComponent children={None.of()} className="custom-class" />
      )

      expect(container.firstChild).toHaveClass("custom-class")
    })

    test("should apply className when loaded", () => {
      const { container } = render(
        <LoadableComponent
          children={Some.of(<span>Content</span>)}
          className="loaded-class"
        />
      )

      expect(container.firstChild).toHaveClass("loaded-class")
    })
  })

  describe("Edge Cases", () => {
    test("should handle null as children value in Some", () => {
      render(<LoadableComponent children={Some.of(null)} />)

      // null renders as empty, no error should occur
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()
    })

    test("should handle empty fragment as children", () => {
      render(<LoadableComponent children={Some.of(<></>)} />)

      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()
    })

    test("should handle false as children value", () => {
      render(<LoadableComponent children={Some.of(false)} />)

      // false renders as empty in React
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()
    })

    test("should handle array of elements as children", () => {
      const elements = [
        <div key="1">First</div>,
        <div key="2">Second</div>,
        <div key="3">Third</div>,
      ]
      render(<LoadableComponent children={Some.of(elements)} />)

      expect(screen.getByText("First")).toBeInTheDocument()
      expect(screen.getByText("Second")).toBeInTheDocument()
      expect(screen.getByText("Third")).toBeInTheDocument()
    })
  })
})
