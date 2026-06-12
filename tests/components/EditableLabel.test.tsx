import { describe, expect, test, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import EditableLabel from "~/components/editable-label/EditableLabel"

// Helper function to enter edit mode
async function enterEditMode(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /edit/i }))
}

describe("EditableLabel", () => {
  describe("Read Mode", () => {
    test("should display text value in read mode", () => {
      const onUpdateText = vi.fn()
      render(<EditableLabel textValue="Test Title" onUpdateText={onUpdateText} />)

      expect(screen.getByText("Test Title")).toBeInTheDocument()
    })

    test("should always render the edit button so it is reachable by keyboard", () => {
      const onUpdateText = vi.fn()
      render(<EditableLabel textValue="Test Title" onUpdateText={onUpdateText} />)

      expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument()
    })

    test("should update displayed label when textValue prop changes", () => {
      const onUpdateText = vi.fn()
      const { rerender } = render(<EditableLabel textValue="Initial Title" onUpdateText={onUpdateText} />)

      expect(screen.getByText("Initial Title")).toBeInTheDocument()

      rerender(<EditableLabel textValue="Updated Title" onUpdateText={onUpdateText} />)

      expect(screen.getByText("Updated Title")).toBeInTheDocument()
      expect(screen.queryByText("Initial Title")).not.toBeInTheDocument()
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

    test("should stay in edit mode and log the error when save fails", async () => {
      const user = userEvent.setup()
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      const saveError = new Error("Save failed")
      const onUpdateText = vi.fn().mockRejectedValue(saveError)
      render(<EditableLabel textValue="Test Title" onUpdateText={onUpdateText} />)

      await enterEditMode(user)

      await user.click(screen.getByRole("button", { name: /save/i }))

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to update text", saveError)
      })
      expect(screen.getByRole("textbox")).toBeInTheDocument()
      expect(screen.getByRole("textbox")).toHaveValue("Test Title")

      consoleErrorSpy.mockRestore()
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
