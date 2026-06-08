import React from "react"
import { VisibilityOff, Visibility } from "@mui/icons-material"
import { useApplicationConfiguration } from "~/providers/ApplicationConfigurationProvider"
import QuickSettingsButton from "./QuickSettingsButton"

const SafeModeSwitch = () => {
  const { safeMode, setSafeMode } = useApplicationConfiguration()

  return (
    <QuickSettingsButton
      tooltip={safeMode ? "Disable Safe Mode" : "Enable Safe Mode"}
      ariaLabel={safeMode ? "Disable safe mode" : "Enable safe mode"}
      icon={safeMode ? <VisibilityOff /> : <Visibility />}
      onClick={() => setSafeMode(!safeMode)}
    />
  )
}

export default SafeModeSwitch
