import React, {type FC, type ReactNode} from "react"
import {SortBy} from "~/models/SortBy"
import {FormControl, InputLabel, ListItemIcon, ListItemText, MenuItem, Select, type SelectChangeEvent} from "@mui/material"
import CalendarTodayIcon from "@mui/icons-material/CalendarToday"
import StorageIcon from "@mui/icons-material/Storage"
import TimerIcon from "@mui/icons-material/Timer"
import TitleIcon from "@mui/icons-material/Title"
import VisibilityIcon from "@mui/icons-material/Visibility"
import ShuffleIcon from "@mui/icons-material/Shuffle"

type SortBySelectionProps = {
  readonly sortBy: SortBy
  readonly onChange: (value: SortBy) => void
  readonly className?: string
}

const sortByIcons: Record<SortBy, ReactNode> = {
  [SortBy.Date]: <CalendarTodayIcon fontSize="small" />,
  [SortBy.Size]: <StorageIcon fontSize="small" />,
  [SortBy.Duration]: <TimerIcon fontSize="small" />,
  [SortBy.Title]: <TitleIcon fontSize="small" />,
  [SortBy.WatchTime]: <VisibilityIcon fontSize="small" />,
  [SortBy.Random]: <ShuffleIcon fontSize="small" />,
}

const SortBySelection: FC<SortBySelectionProps> = props => (
  <FormControl fullWidth size="small" className={props.className}>
    <InputLabel id="sort-by-selector-label">Sort by</InputLabel>
    <Select
      size="small"
      id="sort-by-selector"
      labelId="sort-by-selector-label"
      value={props.sortBy}
      label="Sort by"
      onChange={(changeEvent: SelectChangeEvent<SortBy>) => props.onChange(changeEvent.target.value as SortBy)}
      renderValue={(value) => {
        const label = Object.entries(SortBy).find(([, v]) => v === value)?.[0]
        return (
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {sortByIcons[value]}
            {label}
          </span>
        )
      }}>
      {
        Object.entries(SortBy)
          .map(([key, value]) => (
              <MenuItem key={key} value={value}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {sortByIcons[value]}
                </ListItemIcon>
                <ListItemText>{key}</ListItemText>
              </MenuItem>
            )
          )
      }
    </Select>
  </FormControl>
)

export default SortBySelection
