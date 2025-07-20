import React from "react"
import { FormGroup } from "@mui/material"
import styles from "./QuickSettings.module.css"
import SafeModeSwitch from "./switches/SafeModeSwitch"
import WorkerStatusSwitch from "./switches/WorkerStatusSwitch"
import ThemeSwitch from "~/components/quick-settings/switches/ThemeSwitch"

const QuickSettings = () => (
  <FormGroup className={styles.quickSettings}>
    <ThemeSwitch />
    <SafeModeSwitch/>
    <WorkerStatusSwitch />
  </FormGroup>
)

export default QuickSettings
