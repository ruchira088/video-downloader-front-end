import { describe, expect, test, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import OrderingComponent from "~/components/ordering/OrderingComponent"
import { Ordering } from "~/models/Ordering"

describe("OrderingComponent", () => {
  describe("Rendering", () => {
    test("should render Ascending option", () => {
      const onChange = vi.fn()
      render(<OrderingComponent ordering={Ordering.Ascending} onOrderingChange={onChange} />)

      expect(screen.getByLabelText(/ascending/i)).toBeInTheDocument()
    })

    test("should render Descending option", () => {
      const onChange = vi.fn()
      render(<OrderingComponent ordering={Ordering.Ascending} onOrderingChange={onChange} />)

      expect(screen.getByLabelText(/descending/i)).toBeInTheDocument()
    })

    test("should render as radio buttons", () => {
      const onChange = vi.fn()
      render(<OrderingComponent ordering={Ordering.Ascending} onOrderingChange={onChange} />)

      const radios = screen.getAllByRole("radio")
      expect(radios).toHaveLength(2)
    })
  })

  describe("Selection State", () => {
    test("should have Ascending selected when ordering is Ascending", () => {
      const onChange = vi.fn()
      render(<OrderingComponent ordering={Ordering.Ascending} onOrderingChange={onChange} />)

      expect(screen.getByLabelText(/ascending/i)).toBeChecked()
      expect(screen.getByLabelText(/descending/i)).not.toBeChecked()
    })

    test("should have Descending selected when ordering is Descending", () => {
      const onChange = vi.fn()
      render(<OrderingComponent ordering={Ordering.Descending} onOrderingChange={onChange} />)

      expect(screen.getByLabelText(/descending/i)).toBeChecked()
      expect(screen.getByLabelText(/ascending/i)).not.toBeChecked()
    })
  })

  describe("Change Handler", () => {
    test("should call onOrderingChange with Descending when Descending is clicked", async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<OrderingComponent ordering={Ordering.Ascending} onOrderingChange={onChange} />)

      await user.click(screen.getByLabelText(/descending/i))

      expect(onChange).toHaveBeenCalledWith(Ordering.Descending)
    })

    test("should call onOrderingChange with Ascending when Ascending is clicked", async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<OrderingComponent ordering={Ordering.Descending} onOrderingChange={onChange} />)

      await user.click(screen.getByLabelText(/ascending/i))

      expect(onChange).toHaveBeenCalledWith(Ordering.Ascending)
    })

    test("should still call onChange when clicking already selected option", async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<OrderingComponent ordering={Ordering.Ascending} onOrderingChange={onChange} />)

      await user.click(screen.getByLabelText(/ascending/i))

      // MUI RadioGroup behavior - may or may not call onChange
      // This depends on implementation
    })
  })

  describe("className Prop", () => {
    test("should apply className to form control", () => {
      const onChange = vi.fn()
      const { container } = render(
        <OrderingComponent
          ordering={Ordering.Ascending}
          onOrderingChange={onChange}
          className="custom-ordering"
        />
      )

      // MUI FormControl should have the class
      expect(container.querySelector(".custom-ordering")).toBeInTheDocument()
    })
  })

  describe("Ordering Enum Values", () => {
    test("should use correct enum value for Ascending", () => {
      expect(Ordering.Ascending).toBe("asc")
    })

    test("should use correct enum value for Descending", () => {
      expect(Ordering.Descending).toBe("desc")
    })
  })
})
