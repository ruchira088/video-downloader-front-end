import React, { type JSX, useState } from "react"
import { Slider } from "@mui/material"
import classNames from "classnames"
import { fromNumberArray, type Range, toNumberArray } from "~/models/Range"
import { type Codec } from "~/models/Codec"
import RangeDisplay, { type PrettyPrint } from "./RangeDisplay"
import styles from "./RangeSlider.module.css"

type RangeSliderProps<A> = {
  range: Range<A>
  onChange: (value: Range<A>) => void
  maxValue: A
  codec: Codec<A, number>
  printer: PrettyPrint<A>
  title: string
  className?: string
}

function RangeSlider<A>(props: RangeSliderProps<A>): JSX.Element {
  const [transientRange, setTransientRange] = useState(props.range)

  const toRange = (values: number | number[]): Range<A> =>
    fromNumberArray(
      ([] as number[]).concat(values),
      props.codec,
      (value) => props.codec.encode(value) >= props.codec.encode(props.maxValue)
    )
      .toOption()
      .getOrElse(() => props.range)

  return (
    <div className={classNames(styles.rangeSlider, props.className)}>
      <div className={styles.description}>
        <span className={styles.title}>{props.title}</span>
        <RangeDisplay range={transientRange} printer={props.printer} className={styles.rangeDisplay} />
      </div>
      <Slider
        max={props.codec.encode(props.maxValue)}
        value={toNumberArray(transientRange, props.maxValue, props.codec)}
        onChange={(event, value) => setTransientRange(toRange(value))}
        onChangeCommitted={(event, value) => props.onChange(toRange(value))}
        className={styles.slider}
      />
    </div>
  )
}

export default RangeSlider