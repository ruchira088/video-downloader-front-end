import { FormControlLabel, Switch } from "@mui/material"
import React from "react"
import { type Settings } from "~/components/quick-settings/QuickSettings"

export default (settings: Settings) => (
  <FormControlLabel
    control={
      <Switch
        checked={settings.safeMode}
        onChange={({ target }) => settings.setApplicationContext({ safeMode: target.checked })}
      />
    }
    label="Safe Mode"
  />
)
