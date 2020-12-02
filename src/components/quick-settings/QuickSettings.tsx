import React from "react"
import { FormControlLabel, FormGroup, Switch } from "@material-ui/core"
import { ApplicationContext } from "context/ApplicationContext"
import styles from "./QuickSettings.module.css"

export type QuickSettings = ApplicationContext & {
  setApplicationContext: (applicationContext: ApplicationContext) => void
}

export default (settings: QuickSettings) => (
  <FormGroup className={styles.quickSettings}>
    <FormControlLabel
      control={
        <Switch
          checked={settings.safeMode}
          onChange={({ target }) => settings.setApplicationContext({ safeMode: target.checked })}
        />
      }
      label="Safe Mode"
    />
  </FormGroup>
)
