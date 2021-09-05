import React, { useState } from "react"
import { fromNumberArray, Range, toNumberArray } from "models/Range"
import { Slider } from "@material-ui/core"
import { Codec } from "models/Codec"

export function RangeSlider<A>(props: { range: Range<A>, onChange: (value: Range<A>) => void, maxValue: A, codec: Codec<A, number> }): JSX.Element {
  const [transientRange, setTransientRange] = useState(props.range)

  const toRange = (values: number | number[]): Range<A> =>
    fromNumberArray(([] as number[]).concat(values), props.codec, value => props.codec.encode(value) >= props.codec.encode(props.maxValue))
      .toMaybe().getOrElse(props.range)

  return (
    <Slider
      max={props.codec.encode(props.maxValue)}
      value={toNumberArray(transientRange, props.maxValue, props.codec)}
      onChange={(event, value) => setTransientRange(toRange(value))}
      onChangeCommitted={(event, value) => props.onChange(toRange(value ))}
    />
  )
}
