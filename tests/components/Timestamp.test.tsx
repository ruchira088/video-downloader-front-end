import { describe, expect, test } from "vitest"
import { render } from "@testing-library/react"
import { DateTime } from "luxon"
import Timestamp from "~/components/timestamp/Timestamp"

describe("Timestamp", () => {
  // Use a fixed "now" for predictable relative time testing
  const fixedNow = DateTime.fromISO("2024-06-15T12:00:00Z")

  describe("Basic Rendering", () => {
    test("should render timestamp", () => {
      const timestamp = DateTime.fromISO("2024-06-15T10:30:00Z")
      const { container } = render(<Timestamp timestamp={timestamp} currentTimestamp={fixedNow} />)

      // Should render something (format varies by locale)
      expect(container.textContent).toBeTruthy()
      expect(container.textContent!.length).toBeGreaterThan(0)
    })

    test("should include relative time in parentheses", () => {
      const timestamp = DateTime.fromISO("2024-06-14T12:00:00Z") // 1 day ago
      const { container } = render(
        <Timestamp timestamp={timestamp} currentTimestamp={fixedNow} />
      )

      // Should contain parentheses
      expect(container.textContent).toContain("(")
      expect(container.textContent).toContain(")")
    })
  })

  describe("Relative Time", () => {
    test("should show past relative time", () => {
      const timestamp = DateTime.fromISO("2024-06-14T12:00:00Z") // 1 day ago
      const { container } = render(
        <Timestamp timestamp={timestamp} currentTimestamp={fixedNow} />
      )

      // Should contain "ago"
      expect(container.textContent).toContain("ago")
    })

    test("should show future relative time", () => {
      const timestamp = DateTime.fromISO("2024-06-16T12:00:00Z") // 1 day in future
      const { container } = render(
        <Timestamp timestamp={timestamp} currentTimestamp={fixedNow} />
      )

      // Should contain "in"
      expect(container.textContent).toContain("in")
    })
  })

  describe("Custom Format", () => {
    test("should accept custom format", () => {
      const timestamp = DateTime.fromISO("2024-06-15T10:30:00Z")
      const { container } = render(
        <Timestamp
          timestamp={timestamp}
          currentTimestamp={fixedNow}
          format={DateTime.DATE_FULL}
        />
      )

      // Should render without error
      expect(container.textContent).toBeTruthy()
    })

    test("should accept TIME_SIMPLE format", () => {
      const timestamp = DateTime.fromISO("2024-06-15T10:30:00Z")
      const { container } = render(
        <Timestamp
          timestamp={timestamp}
          currentTimestamp={fixedNow}
          format={DateTime.TIME_SIMPLE}
        />
      )

      // Should render without error
      expect(container.textContent).toBeTruthy()
    })
  })

  describe("className Prop", () => {
    test("should apply className to container", () => {
      const timestamp = DateTime.fromISO("2024-06-15T10:30:00Z")
      const { container } = render(
        <Timestamp
          timestamp={timestamp}
          currentTimestamp={fixedNow}
          className="custom-timestamp"
        />
      )

      expect(container.firstChild).toHaveClass("custom-timestamp")
    })
  })

  describe("Default currentTimestamp", () => {
    test("should render without currentTimestamp", () => {
      // Use a timestamp relative to actual now
      const recentTimestamp = DateTime.now().minus({ hours: 1 })
      const { container } = render(<Timestamp timestamp={recentTimestamp} />)

      // Should render without error
      expect(container.textContent).toBeTruthy()
    })
  })

  describe("Edge Cases", () => {
    test("should handle same timestamp as current", () => {
      const { container } = render(
        <Timestamp timestamp={fixedNow} currentTimestamp={fixedNow} />
      )

      // Should render without error
      expect(container.textContent).toBeTruthy()
    })

    test("should handle very old timestamps", () => {
      const oldTimestamp = DateTime.fromISO("2020-01-01T00:00:00Z")
      const { container } = render(
        <Timestamp timestamp={oldTimestamp} currentTimestamp={fixedNow} />
      )

      // Should contain "years ago"
      expect(container.textContent).toContain("years ago")
    })

    test("should handle very future timestamps", () => {
      const futureTimestamp = DateTime.fromISO("2030-01-01T00:00:00Z")
      const { container } = render(
        <Timestamp timestamp={futureTimestamp} currentTimestamp={fixedNow} />
      )

      // Should contain "in" and "years"
      expect(container.textContent).toContain("in")
      expect(container.textContent).toContain("years")
    })
  })
})
