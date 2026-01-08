import { describe, expect, test, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import SortBySelection from "~/components/sort-by-selection/SortBySelection"
import { SortBy } from "~/models/SortBy"

describe("SortBySelection", () => {
  describe("Rendering", () => {
    test("should render select with label", () => {
      const onChange = vi.fn()
      render(<SortBySelection sortBy={SortBy.Date} onChange={onChange} />)

      expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument()
    })

    test("should render with combobox role", () => {
      const onChange = vi.fn()
      render(<SortBySelection sortBy={SortBy.Date} onChange={onChange} />)

      expect(screen.getByRole("combobox")).toBeInTheDocument()
    })

    test("should display current selection", () => {
      const onChange = vi.fn()
      render(<SortBySelection sortBy={SortBy.Date} onChange={onChange} />)

      // MUI Select shows the key name, which is "Date" for SortBy.Date
      expect(screen.getByRole("combobox")).toHaveTextContent("Date")
    })
  })

  describe("Selection State", () => {
    test("should show Date as selected when sortBy is Date", () => {
      const onChange = vi.fn()
      render(<SortBySelection sortBy={SortBy.Date} onChange={onChange} />)

      expect(screen.getByRole("combobox")).toHaveTextContent("Date")
    })

    test("should show Size as selected when sortBy is Size", () => {
      const onChange = vi.fn()
      render(<SortBySelection sortBy={SortBy.Size} onChange={onChange} />)

      expect(screen.getByRole("combobox")).toHaveTextContent("Size")
    })

    test("should show Duration as selected when sortBy is Duration", () => {
      const onChange = vi.fn()
      render(<SortBySelection sortBy={SortBy.Duration} onChange={onChange} />)

      expect(screen.getByRole("combobox")).toHaveTextContent("Duration")
    })

    test("should show Title as selected when sortBy is Title", () => {
      const onChange = vi.fn()
      render(<SortBySelection sortBy={SortBy.Title} onChange={onChange} />)

      expect(screen.getByRole("combobox")).toHaveTextContent("Title")
    })

    test("should show WatchTime as selected when sortBy is WatchTime", () => {
      const onChange = vi.fn()
      render(<SortBySelection sortBy={SortBy.WatchTime} onChange={onChange} />)

      expect(screen.getByRole("combobox")).toHaveTextContent("WatchTime")
    })

    test("should show Random as selected when sortBy is Random", () => {
      const onChange = vi.fn()
      render(<SortBySelection sortBy={SortBy.Random} onChange={onChange} />)

      expect(screen.getByRole("combobox")).toHaveTextContent("Random")
    })
  })

  describe("Options Menu", () => {
    test("should show all options when opened", async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<SortBySelection sortBy={SortBy.Date} onChange={onChange} />)

      // Click to open dropdown
      await user.click(screen.getByRole("combobox"))

      // Check all options are present
      const listbox = screen.getByRole("listbox")
      expect(within(listbox).getByRole("option", { name: "Date" })).toBeInTheDocument()
      expect(within(listbox).getByRole("option", { name: "Size" })).toBeInTheDocument()
      expect(within(listbox).getByRole("option", { name: "Duration" })).toBeInTheDocument()
      expect(within(listbox).getByRole("option", { name: "Title" })).toBeInTheDocument()
      expect(within(listbox).getByRole("option", { name: "WatchTime" })).toBeInTheDocument()
      expect(within(listbox).getByRole("option", { name: "Random" })).toBeInTheDocument()
    })

    test("should have 6 options total", async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<SortBySelection sortBy={SortBy.Date} onChange={onChange} />)

      await user.click(screen.getByRole("combobox"))

      const options = screen.getAllByRole("option")
      expect(options).toHaveLength(6)
    })
  })

  describe("Change Handler", () => {
    test("should call onChange with Size when Size is selected", async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<SortBySelection sortBy={SortBy.Date} onChange={onChange} />)

      await user.click(screen.getByRole("combobox"))
      await user.click(screen.getByRole("option", { name: "Size" }))

      expect(onChange).toHaveBeenCalledWith(SortBy.Size)
    })

    test("should call onChange with Duration when Duration is selected", async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<SortBySelection sortBy={SortBy.Date} onChange={onChange} />)

      await user.click(screen.getByRole("combobox"))
      await user.click(screen.getByRole("option", { name: "Duration" }))

      expect(onChange).toHaveBeenCalledWith(SortBy.Duration)
    })

    test("should call onChange with Title when Title is selected", async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<SortBySelection sortBy={SortBy.Date} onChange={onChange} />)

      await user.click(screen.getByRole("combobox"))
      await user.click(screen.getByRole("option", { name: "Title" }))

      expect(onChange).toHaveBeenCalledWith(SortBy.Title)
    })

    test("should call onChange with Random when Random is selected", async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<SortBySelection sortBy={SortBy.Date} onChange={onChange} />)

      await user.click(screen.getByRole("combobox"))
      await user.click(screen.getByRole("option", { name: "Random" }))

      expect(onChange).toHaveBeenCalledWith(SortBy.Random)
    })
  })

  describe("className Prop", () => {
    test("should apply className to form control", () => {
      const onChange = vi.fn()
      const { container } = render(
        <SortBySelection sortBy={SortBy.Date} onChange={onChange} className="custom-select" />
      )

      expect(container.querySelector(".custom-select")).toBeInTheDocument()
    })
  })

  describe("SortBy Enum Values", () => {
    test("should have correct enum values", () => {
      expect(SortBy.Date).toBe("date")
      expect(SortBy.Size).toBe("size")
      expect(SortBy.Duration).toBe("duration")
      expect(SortBy.Title).toBe("title")
      expect(SortBy.WatchTime).toBe("watch-time")
      expect(SortBy.Random).toBe("random")
    })
  })
})
