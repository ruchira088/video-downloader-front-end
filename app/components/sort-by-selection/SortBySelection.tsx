import React, {type FC} from "react"
import {SortBy} from "~/models/SortBy"
import {FormControl, InputLabel, MenuItem, Select, type SelectChangeEvent} from "@mui/material"

type SortBySelectionProps = {
  readonly sortBy: SortBy
  readonly onChange: (value: SortBy) => void
  readonly className?: string
}

const SortBySelection: FC<SortBySelectionProps> = props => (
  <FormControl fullWidth className={props.className}>
    <InputLabel id="sort-by-selector-label">Sort by</InputLabel>
    <Select
      id="sort-by-selector"
      labelId="sort-by-selector-label"
      value={props.sortBy}
      label="Sort by"
      onChange={(changeEvent: SelectChangeEvent<SortBy>) => props.onChange(changeEvent.target.value as SortBy)}>
      {
        Object.entries(SortBy)
          .map(([key, value]) => (
              <MenuItem key={key} value={value}>
                {key}
              </MenuItem>
            )
          )
      }
    </Select>
  </FormControl>
)

export default SortBySelection
