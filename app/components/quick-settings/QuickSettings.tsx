import React, { type FC } from "react"
import { FormGroup } from "@mui/material"
import { type ApplicationContext } from "~/context/ApplicationContext"
import styles from "./QuickSettings.module.css"
import SafeModeSwitch from "./switches/SafeModeSwitch"
import WorkerStatusSwitch from "./switches/WorkerStatusSwitch"

type QuickSettingsProps = {
  readonly setApplicationContext: (applicationContext: ApplicationContext) => void
}

const QuickSettings: FC<QuickSettingsProps> = props => (
  <FormGroup className={styles.quickSettings}>
    <SafeModeSwitch {...props} />
    <WorkerStatusSwitch />
  </FormGroup>
)

export default QuickSettings
