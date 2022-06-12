import React from "react"
import { SortBy } from "models/SortBy"
import { MenuItem, Select } from "@material-ui/core"

const SortBySelection = ({
  value,
  onChange,
  className,
}: {
  value: SortBy
  onChange: (value: SortBy) => void
  className?: string
}) => (
  <div className={className}>
    <Select
      value={value}
      onChange={(event: React.ChangeEvent<{ name?: string; value: unknown }>) => onChange(event.target.value as SortBy)}
    >
      {Object.keys(SortBy).map((key) => (
        <MenuItem key={key} value={(SortBy as { [key: string]: string })[key]}>
          {key}
        </MenuItem>
      ))}
    </Select>
  </div>
)

export default SortBySelection
