import type {FC} from "react"
import {FormControl, FormControlLabel, Radio, RadioGroup} from "@mui/material"
import {Ordering} from "~/models/Ordering"


type OrderingComponentProps = {
  readonly ordering: Ordering,
  readonly onOrderingChange: (ordering: Ordering) => void,
  readonly className?: string,
}

const OrderingComponent: FC<OrderingComponentProps> = props =>
  <FormControl className={props.className}>
    <RadioGroup row value={props.ordering} onChange={value => props.onOrderingChange(value.target.value as Ordering)}>
      <FormControlLabel value={Ordering.Ascending} control={<Radio/>} label="Ascending"/>
      <FormControlLabel value={Ordering.Descending} control={<Radio/>} label="Descending"/>
    </RadioGroup>
  </FormControl>

export default OrderingComponent