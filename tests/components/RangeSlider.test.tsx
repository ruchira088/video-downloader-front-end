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
import { Left, Right } from "~/types/Either"
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
    // MUI drives keyboard changes through hidden range inputs, one per thumb; a change event on
    // one of them commits a new value the way releasing a drag does.
    const sliderInputs = (container: HTMLElement) => container.querySelectorAll("input[type='range']")

    test("should commit the moved thumb through the codec", () => {
      const props = createDefaultProps()
      const { container } = render(<RangeSlider {...props} />)

      fireEvent.change(sliderInputs(container)[0], { target: { value: "25" } })

      expect(props.onChange).toHaveBeenCalledWith({ min: 25, max: Some.of(50) })
      expect(screen.getByText("25")).toBeInTheDocument()
    })

    test("should report an unbounded maximum when the upper thumb reaches the end", () => {
      const props = createDefaultProps()
      const { container } = render(<RangeSlider {...props} />)

      fireEvent.change(sliderInputs(container)[1], { target: { value: "100" } })

      expect(props.onChange).toHaveBeenCalledWith({ min: 0, max: None.of() })
      expect(screen.getByText("Max")).toBeInTheDocument()
    })

    test("should size the slider from the encoded maximum", () => {
      // Custom codec that doubles values
      const doublingCodec: Codec<number, number> = {
        encode: (n) => n * 2,
        decode: (n) => Right.of(n / 2),
      }

      const { container } = render(<RangeSlider {...createDefaultProps()} codec={doublingCodec} maxValue={50} />)

      sliderInputs(container).forEach(input => expect(input).toHaveAttribute("max", "100"))
    })

    test("should keep the committed range when a moved value cannot be decoded", () => {
      const rejectingCodec: Codec<number, number> = {
        encode: (n) => n,
        decode: (n) => (n === 25 ? Left.of(new Error("rejected")) : Right.of(n)),
      }
      const props = { ...createDefaultProps(), codec: rejectingCodec }
      const { container } = render(<RangeSlider {...props} />)

      fireEvent.change(sliderInputs(container)[0], { target: { value: "25" } })

      expect(props.onChange).toHaveBeenCalledWith({ min: 0, max: Some.of(50) })
    })
  })

  // The slider keeps a transient range while dragging and only calls onChange on release, so it
  // has to adopt a committed range that changes from outside without discarding a drag in flight.
  describe("Committed range synchronisation", () => {
    test("should adopt a range prop that changes from outside", () => {
      const props = createDefaultProps()
      const { rerender } = render(<RangeSlider {...props} />)

      expect(screen.getByText("50")).toBeInTheDocument()

      rerender(<RangeSlider {...props} range={{ min: 20, max: Some.of(80) } as Range<number>} />)

      expect(screen.getByText("20")).toBeInTheDocument()
      expect(screen.getByText("80")).toBeInTheDocument()
    })

    test("should settle rather than re-render forever when the range prop is unchanged", () => {
      // The committed range is adopted during render, so a comparison that never converges would
      // spin. Re-render with the same prop and assert the output is stable.
      const props = createDefaultProps()
      const { rerender } = render(<RangeSlider {...props} />)

      for (let i = 0; i < 5; i++) {
        rerender(<RangeSlider {...props} />)
      }

      expect(screen.getByText("0")).toBeInTheDocument()
      expect(screen.getByText("50")).toBeInTheDocument()
      expect(props.onChange).not.toHaveBeenCalled()
    })
  })
})
