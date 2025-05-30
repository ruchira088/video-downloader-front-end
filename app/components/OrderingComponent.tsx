import type {FC} from "react"
import {FormControl, FormControlLabel, Radio, RadioGroup} from "@mui/material"
import {Ordering} from "~/models/Ordering"


type OrderingComponentProps = {
  readonly ordering: Ordering,
  readonly onOrderingChange: (ordering: Ordering) => void,
}

const OrderingComponent: FC<OrderingComponentProps> = props =>
  <FormControl>
    <RadioGroup value={props.ordering} onChange={value => props.onOrderingChange(value.target.value as Ordering)}>
      <FormControlLabel value={Ordering.Ascending} control={<Radio/>} label={<div>Ascending</div>}/>
      <FormControlLabel value={Ordering.Descending} control={<Radio/>} label={<div>Descending</div>}/>
    </RadioGroup>
  </FormControl>

export default OrderingComponent