import { describe, expect, test, vi } from "vitest"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import EditableLabel from "~/components/editable-label/EditableLabel"

// Helper function to enter edit mode
async function enterEditMode(user: ReturnType<typeof userEvent.setup>) {
  const textContainer = screen.getByText(/Title/).closest("div")!
  await act(async () => {
    fireEvent.mouseEnter(textContainer)
  })
  const editButton = await screen.findByRole("button", { name: /edit/i })
  await user.click(editButton)
}

describe("EditableLabel", () => {
  describe("Read Mode", () => {
    test("should display text value in read mode", () => {
      const onUpdateText = vi.fn()
      render(<EditableLabel textValue="Test Title" onUpdateText={onUpdateText} />)

      expect(screen.getByText("Test Title")).toBeInTheDocument()
    })

    test("should not show edit button initially", () => {
      const onUpdateText = vi.fn()
      render(<EditableLabel textValue="Test Title" onUpdateText={onUpdateText} />)

      expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument()
    })

    test("should show edit button on hover", async () => {
      const onUpdateText = vi.fn()
      render(<EditableLabel textValue="Test Title" onUpdateText={onUpdateText} />)

      const textContainer = screen.getByText("Test Title").closest("div")!
      await act(async () => {
        fireEvent.mouseEnter(textContainer)
      })

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument()
      })
    })

    test("should hide edit button when mouse leaves", async () => {
      const onUpdateText = vi.fn()
      render(<EditableLabel textValue="Test Title" onUpdateText={onUpdateText} />)

      const textContainer = screen.getByText("Test Title").closest("div")!

      await act(async () => {
        fireEvent.mouseEnter(textContainer)
      })
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument()
      })

      await act(async () => {
        fireEvent.mouseLeave(textContainer)
      })
      await waitFor(() => {
        expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument()
      })
    })
  })

  describe("Edit Mode", () => {
    test("should enter edit mode when edit button is clicked", async () => {
      const user = userEvent.setup()
      const onUpdateText = vi.fn()
      render(<EditableLabel textValue="Test Title" onUpdateText={onUpdateText} />)

      await enterEditMode(user)

      // Should show text field with value
      expect(screen.getByRole("textbox")).toBeInTheDocument()
      expect(screen.getByRole("textbox")).toHaveValue("Test Title")
    })

    test("should show Save and Cancel buttons in edit mode", async () => {
      const user = userEvent.setup()
      const onUpdateText = vi.fn()
      render(<EditableLabel textValue="Test Title" onUpdateText={onUpdateText} />)

      await enterEditMode(user)

      expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument()
    })

    test("should update text value when typing", async () => {
      const user = userEvent.setup()
      const onUpdateText = vi.fn()
      render(<EditableLabel textValue="Test Title" onUpdateText={onUpdateText} />)

      await enterEditMode(user)

      const textField = screen.getByRole("textbox")
      await user.clear(textField)
      await user.type(textField, "New Title")

      expect(textField).toHaveValue("New Title")
    })
  })

  describe("Save Action", () => {
    test("should call onUpdateText with new value when Save is clicked", async () => {
      const user = userEvent.setup()
      const onUpdateText = vi.fn().mockResolvedValue(undefined)
      render(<EditableLabel textValue="Test Title" onUpdateText={onUpdateText} />)

      await enterEditMode(user)

      const textField = screen.getByRole("textbox")
      await user.clear(textField)
      await user.type(textField, "Updated Title")

      await user.click(screen.getByRole("button", { name: /save/i }))

      expect(onUpdateText).toHaveBeenCalledWith("Updated Title")
    })

    test("should exit edit mode after successful save", async () => {
      const user = userEvent.setup()
      const onUpdateText = vi.fn().mockResolvedValue(undefined)
      render(<EditableLabel textValue="Test Title" onUpdateText={onUpdateText} />)

      await enterEditMode(user)

      await user.click(screen.getByRole("button", { name: /save/i }))

      await waitFor(() => {
        expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
      })
    })
  })

  describe("Cancel Action", () => {
    test("should restore original text when Cancel is clicked", async () => {
      const user = userEvent.setup()
      const onUpdateText = vi.fn()
      render(<EditableLabel textValue="Original Title" onUpdateText={onUpdateText} />)

      await enterEditMode(user)

      const textField = screen.getByRole("textbox")
      await user.clear(textField)
      await user.type(textField, "Changed Title")

      await user.click(screen.getByRole("button", { name: /cancel/i }))

      // Should exit edit mode and show original text
      await waitFor(() => {
        expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
      })
      expect(screen.getByText("Original Title")).toBeInTheDocument()
    })

    test("should not call onUpdateText when Cancel is clicked", async () => {
      const user = userEvent.setup()
      const onUpdateText = vi.fn()
      render(<EditableLabel textValue="Test Title" onUpdateText={onUpdateText} />)

      await enterEditMode(user)

      await user.click(screen.getByRole("button", { name: /cancel/i }))

      expect(onUpdateText).not.toHaveBeenCalled()
    })

    test("should exit edit mode when Cancel is clicked", async () => {
      const user = userEvent.setup()
      const onUpdateText = vi.fn()
      render(<EditableLabel textValue="Test Title" onUpdateText={onUpdateText} />)

      await enterEditMode(user)

      await user.click(screen.getByRole("button", { name: /cancel/i }))

      await waitFor(() => {
        expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
        expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument()
        expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument()
      })
    })
  })
})
