import React from "react"
import { FormGroup } from "@material-ui/core"
import { ApplicationContext } from "context/ApplicationContext"
import styles from "./QuickSettings.module.css"
import SafeModeSwitch from "./switches/SafeModeSwitch"
import WorkerStatusSwitch from "./switches/WorkerStatusSwitch"

export type QuickSettings = ApplicationContext & {
  setApplicationContext: (applicationContext: ApplicationContext) => void
}

export default (settings: QuickSettings) => (
  <FormGroup className={styles.quickSettings}>
    <SafeModeSwitch {...settings} />
    <WorkerStatusSwitch />
  </FormGroup>
)
