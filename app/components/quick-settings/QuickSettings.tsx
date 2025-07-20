import React from "react"
import { FormGroup } from "@mui/material"
import styles from "./QuickSettings.module.css"
import SafeModeSwitch from "./switches/SafeModeSwitch"
import WorkerStatusSwitch from "./switches/WorkerStatusSwitch"

const QuickSettings = () => (
  <FormGroup className={styles.quickSettings}>
    <SafeModeSwitch/>
    <WorkerStatusSwitch />
  </FormGroup>
)

export default QuickSettings
