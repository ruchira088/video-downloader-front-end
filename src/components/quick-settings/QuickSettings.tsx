import React from "react"
import { FormGroup } from "@mui/material"
import { ApplicationContext } from "context/ApplicationContext"
import styles from "./QuickSettings.module.css"
import SafeModeSwitch from "./switches/SafeModeSwitch"
import WorkerStatusSwitch from "./switches/WorkerStatusSwitch"

export type Settings = ApplicationContext & {
  setApplicationContext: (applicationContext: ApplicationContext) => void
}

const QuickSettings = (settings: Settings) => (
  <FormGroup className={styles.quickSettings}>
    <SafeModeSwitch {...settings} />
    <WorkerStatusSwitch />
  </FormGroup>
)

export default QuickSettings
