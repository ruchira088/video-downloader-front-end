import React, { type FC, useContext } from "react"
import { FormControlLabel, Switch } from "@mui/material"
import { ApplicationContext } from "~/context/ApplicationContext"

type SafeModeSwitchProps = {
  readonly setApplicationContext: (applicationContext: ApplicationContext) => void
}

const SafeModeSwitch: FC<SafeModeSwitchProps> = props => {
  const { safeMode } = useContext(ApplicationContext)

  return (
    <FormControlLabel
    control={
      <Switch
        checked={safeMode}
        onChange={({ target }) => props.setApplicationContext({ safeMode: target.checked })}
      />
    }
    label="Safe Mode"
  />
)
}

export default SafeModeSwitch
