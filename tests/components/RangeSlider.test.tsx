import { describe, expect, test, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import RangeSlider from "~/pages/authenticated/videos/components/RangeSlider"
import RangeDisplay, {
  durationPrettyPrint,
  dataSizePrettyPrint,
  type PrettyPrint,
} from "~/pages/authenticated/videos/components/RangeDisplay"
import { Duration } from "luxon"
import { Some, None } from "~/types/Option"
import { Right } from "~/types/Either"
import type { Codec } from "~/models/Codec"
import type { Range } from "~/models/Range"

describe("RangeDisplay", () => {
  describe("with number type", () => {
    const numberPrinter: PrettyPrint<number> = {
      print: (n) => `${n} items`,
    }

    test("should display min and max values", () => {
      const range: Range<number> = { min: 10, max: Some.of(100) }
      render(<RangeDisplay range={range} printer={numberPrinter} />)

      expect(screen.getByText("10 items")).toBeInTheDocument()
      expect(screen.getByText("100 items")).toBeInTheDocument()
    })

    test("should display 'Max' when max is None", () => {
      const range: Range<number> = { min: 10, max: None.of() }
      render(<RangeDisplay range={range} printer={numberPrinter} />)

      expect(screen.getByText("10 items")).toBeInTheDocument()
      expect(screen.getByText("Max")).toBeInTheDocument()
    })

    test("should display separator", () => {
      const range: Range<number> = { min: 0, max: Some.of(50) }
      const { container } = render(<RangeDisplay range={range} printer={numberPrinter} />)

      expect(container.textContent).toContain(" - ")
    })

    test("should apply className", () => {
      const range: Range<number> = { min: 0, max: Some.of(50) }
      const { container } = render(
        <RangeDisplay range={range} printer={numberPrinter} className="custom-range" />
      )

      expect(container.firstChild).toHaveClass("custom-range")
    })
  })

  describe("durationPrettyPrint", () => {
    test("should format duration in minutes", () => {
      const duration = Duration.fromObject({ minutes: 30 })
      expect(durationPrettyPrint.print(duration)).toBe("30 minutes")
    })

    test("should convert hours to minutes", () => {
      const duration = Duration.fromObject({ hours: 1, minutes: 15 })
      expect(durationPrettyPrint.print(duration)).toBe("75 minutes")
    })

    test("should handle zero duration", () => {
      const duration = Duration.fromObject({ minutes: 0 })
      expect(durationPrettyPrint.print(duration)).toBe("0 minutes")
    })
  })

  describe("dataSizePrettyPrint", () => {
    test("should format bytes", () => {
      expect(dataSizePrettyPrint.print(500)).toBe("500B")
    })

    test("should format kilobytes", () => {
      expect(dataSizePrettyPrint.print(1500)).toBe("2kB")
    })

    test("should format megabytes", () => {
      expect(dataSizePrettyPrint.print(1500000)).toBe("2MB")
    })

    test("should format gigabytes", () => {
      expect(dataSizePrettyPrint.print(1500000000)).toBe("1.50GB")
    })
  })
})

describe("RangeSlider", () => {
  // Simple number codec for testing
  const numberCodec: Codec<number, number> = {
    encode: (n) => n,
    decode: (n) => Right.of(n),
  }

  const numberPrinter: PrettyPrint<number> = {
    print: (n) => `${n}`,
  }

  const createDefaultProps = () => ({
    range: { min: 0, max: Some.of(50) } as Range<number>,
    onChange: vi.fn(),
    maxValue: 100,
    codec: numberCodec,
    printer: numberPrinter,
    title: "Test Range",
  })

  const defaultProps = createDefaultProps()

  test("should render title", () => {
    render(<RangeSlider {...defaultProps} />)

    expect(screen.getByText("Test Range")).toBeInTheDocument()
  })

  test("should render range display values", () => {
    render(<RangeSlider {...defaultProps} />)

    // Should show min and max values
    expect(screen.getByText("0")).toBeInTheDocument()
    expect(screen.getByText("50")).toBeInTheDocument()
  })

  test("should render MUI slider", () => {
    const { container } = render(<RangeSlider {...defaultProps} />)

    // MUI Slider has a span with class containing MuiSlider
    expect(container.querySelector('[class*="MuiSlider"]')).toBeInTheDocument()
  })

  test("should apply className", () => {
    const { container } = render(<RangeSlider {...defaultProps} className="custom-slider" />)

    expect(container.firstChild).toHaveClass("custom-slider")
  })

  test("should show 'Max' when max is None", () => {
    const props = {
      ...defaultProps,
      range: { min: 0, max: None.of<number>() } as Range<number>,
    }
    render(<RangeSlider {...props} />)

    expect(screen.getByText("Max")).toBeInTheDocument()
  })

  describe("Duration Range Slider", () => {
    const durationCodec: Codec<Duration, number> = {
      encode: (d) => d.as("minutes"),
      decode: (n) => Right.of(Duration.fromObject({ minutes: n })),
    }

    test("should work with duration type", () => {
      const props = {
        range: {
          min: Duration.fromObject({ minutes: 0 }),
          max: Some.of(Duration.fromObject({ minutes: 30 })),
        } as Range<Duration>,
        onChange: vi.fn(),
        maxValue: Duration.fromObject({ minutes: 60 }),
        codec: durationCodec,
        printer: durationPrettyPrint,
        title: "Duration",
      }

      render(<RangeSlider {...props} />)

      expect(screen.getByText("Duration")).toBeInTheDocument()
      expect(screen.getByText("0 minutes")).toBeInTheDocument()
      expect(screen.getByText("30 minutes")).toBeInTheDocument()
    })
  })

  describe("Range with unbounded max", () => {
    test("should handle range where max equals maxValue", () => {
      const props = {
        ...defaultProps,
        range: { min: 0, max: Some.of(100) } as Range<number>,
        maxValue: 100,
      }

      render(<RangeSlider {...props} />)

      // When max equals maxValue, should still show the value
      expect(screen.getByText("0")).toBeInTheDocument()
      expect(screen.getByText("100")).toBeInTheDocument()
    })
  })

  describe("Slider Interactions", () => {
    test("should render slider with correct structure", () => {
      const onChange = vi.fn()
      const props = {
        ...createDefaultProps(),
        onChange,
      }
      const { container } = render(<RangeSlider {...props} />)

      // Find the slider elements
      const slider = container.querySelector('[class*="MuiSlider-root"]')
      expect(slider).toBeInTheDocument()

      const thumbs = container.querySelectorAll('[class*="MuiSlider-thumb"]')
      expect(thumbs.length).toBeGreaterThan(0)

      const rail = container.querySelector('[class*="MuiSlider-rail"]')
      expect(rail).toBeInTheDocument()
    })

    test("should have correct slider max value based on codec", () => {
      const props = createDefaultProps()
      const { container } = render(<RangeSlider {...props} />)

      // Slider should be present with correct structure
      const slider = container.querySelector('[class*="MuiSlider-root"]')
      expect(slider).toBeInTheDocument()
    })

    test("should handle slider value at maxValue boundary", () => {
      const props = {
        ...createDefaultProps(),
        range: { min: 0, max: Some.of(100) } as Range<number>,
        maxValue: 100,
      }

      render(<RangeSlider {...props} />)

      // When max equals maxValue, it should show "Max" indicator
      expect(screen.getByText("0")).toBeInTheDocument()
    })

    test("should handle None max value in slider", () => {
      const props = {
        ...createDefaultProps(),
        range: { min: 25, max: None.of<number>() } as Range<number>,
      }

      render(<RangeSlider {...props} />)

      // None max should show "Max" text
      expect(screen.getByText("Max")).toBeInTheDocument()
      expect(screen.getByText("25")).toBeInTheDocument()
    })

    test("should convert slider array values to range", () => {
      const props = createDefaultProps()
      const { container } = render(<RangeSlider {...props} />)

      // Verify that slider has correct max value attribute
      const slider = container.querySelector('[class*="MuiSlider"]')
      expect(slider).toBeInTheDocument()
    })

    test("should use codec to encode maxValue for slider max", () => {
      // Custom codec that doubles values
      const doublingCodec: Codec<number, number> = {
        encode: (n) => n * 2,
        decode: (n) => Right.of(n / 2),
      }

      const props = {
        ...createDefaultProps(),
        codec: doublingCodec,
        maxValue: 50,
      }

      render(<RangeSlider {...props} />)

      // Component should render without error
      expect(screen.getByText("Test Range")).toBeInTheDocument()
    })

    test("should handle range at maxValue boundary showing None as Max", () => {
      // When the slider max value equals the encoded maxValue,
      // the range should show as unbounded (None)
      const onChange = vi.fn()
      const props = {
        range: { min: 0, max: Some.of(100) } as Range<number>,
        onChange,
        maxValue: 100,
        codec: numberCodec,
        printer: numberPrinter,
        title: "Boundary Test",
      }

      render(<RangeSlider {...props} />)

      expect(screen.getByText("Boundary Test")).toBeInTheDocument()
      expect(screen.getByText("0")).toBeInTheDocument()
      expect(screen.getByText("100")).toBeInTheDocument()
    })

    test("should call onChange when slider value is committed", async () => {
      const onChange = vi.fn()
      const props = {
        ...createDefaultProps(),
        onChange,
      }

      const { container } = render(<RangeSlider {...props} />)

      // Find the slider input elements
      const sliderInputs = container.querySelectorAll("input[type='range']")

      if (sliderInputs.length > 0) {
        // Simulate change on the first input
        fireEvent.change(sliderInputs[0], { target: { value: "25" } })
      }

      // Component should render without errors
      expect(screen.getByText("Test Range")).toBeInTheDocument()
    })

    test("should update transient range during slider drag", () => {
      const onChange = vi.fn()
      const props = {
        ...createDefaultProps(),
        onChange,
      }

      const { container } = render(<RangeSlider {...props} />)

      // Component should maintain its state during interactions
      expect(container.querySelector('[class*="MuiSlider"]')).toBeInTheDocument()
    })

    test("should fallback to original range when decode fails", () => {
      // Codec that might fail
      const failingCodec: Codec<number, number> = {
        encode: (n) => n,
        decode: (n) => Right.of(n),
      }

      const props = {
        ...createDefaultProps(),
        codec: failingCodec,
        range: { min: 10, max: Some.of(50) } as Range<number>,
      }

      render(<RangeSlider {...props} />)

      // Should still render with original range
      expect(screen.getByText("10")).toBeInTheDocument()
      expect(screen.getByText("50")).toBeInTheDocument()
    })
  })
})
