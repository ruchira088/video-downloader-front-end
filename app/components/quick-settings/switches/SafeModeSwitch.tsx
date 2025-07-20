import React from "react"
import { FormControlLabel, Switch } from "@mui/material"
import { useApplicationConfiguration } from "~/providers/ApplicationConfigurationProvider"


const SafeModeSwitch = () => {
  const { safeMode, setSafeMode } = useApplicationConfiguration()

  return (
    <FormControlLabel
    control={
      <Switch
        checked={safeMode}
        onChange={({ target }) => setSafeMode(target.checked)}
      />
    }
    label="Safe Mode"
  />
)
}

export default SafeModeSwitch
