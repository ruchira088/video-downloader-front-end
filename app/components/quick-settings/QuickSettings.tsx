import React from "react"
import styles from "./QuickSettings.module.scss"
import SafeModeSwitch from "./switches/SafeModeSwitch"
import WorkerStatusSwitch from "./switches/WorkerStatusSwitch"
import ThemeSwitch from "~/components/quick-settings/switches/ThemeSwitch"
import LogoutButton from "./switches/LogoutButton"

const QuickSettings = () => (
  <div className={styles.quickSettings}>
    <ThemeSwitch />
    <SafeModeSwitch />
    <WorkerStatusSwitch />
    <LogoutButton />
  </div>
)

export default QuickSettings
