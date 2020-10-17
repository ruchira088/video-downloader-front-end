import React from "react"
import { SortBy } from "models/SortBy"
import NativeSelect from "@material-ui/core/NativeSelect"

export default ({ value, onChange }: { value: SortBy; onChange: (value: SortBy) => void }) => (
  <div>
    <NativeSelect
      value={value}
      onChange={(event: React.ChangeEvent<HTMLSelectElement>) => onChange(event.target.value as SortBy)}
    >
      {Object.keys(SortBy).map((key) => (
        <option value={(SortBy as any)[key]} key={key}>
          {key}
        </option>
      ))}
    </NativeSelect>
  </div>
)
