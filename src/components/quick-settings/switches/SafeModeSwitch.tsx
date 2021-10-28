import { FormControlLabel, Switch } from "@material-ui/core"
import React from "react"
import { QuickSettings } from "components/quick-settings/QuickSettings"

export default (settings: QuickSettings) => (
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
