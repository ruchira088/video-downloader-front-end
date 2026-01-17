import React from "react"
import { IconButton, Tooltip } from "@mui/material"
import { VisibilityOff, Visibility } from "@mui/icons-material"
import { useApplicationConfiguration } from "~/providers/ApplicationConfigurationProvider"
import styles from "./QuickSettingsButton.module.scss"

const SafeModeSwitch = () => {
  const { safeMode, setSafeMode } = useApplicationConfiguration()

  return (
    <Tooltip title={safeMode ? "Disable Safe Mode" : "Enable Safe Mode"}>
      <IconButton
        onClick={() => setSafeMode(!safeMode)}
        size="small"
        aria-label={safeMode ? "Disable safe mode" : "Enable safe mode"}
        className={styles.quickSettingsButton}
      >
        {safeMode ? <VisibilityOff /> : <Visibility />}
      </IconButton>
    </Tooltip>
  )
}

export default SafeModeSwitch
