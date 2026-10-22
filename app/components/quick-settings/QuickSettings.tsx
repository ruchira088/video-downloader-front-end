import React from "react"
import styles from "./QuickSettings.module.scss"
import SafeModeSwitch from "./switches/SafeModeSwitch"
import ThemeSwitch from "~/components/quick-settings/switches/ThemeSwitch"
import LogoutButton from "./switches/LogoutButton"

// Per-user settings only. Pausing the workers is admin-only and lives on the Admin page.
const QuickSettings = () => (
  <div className={styles.quickSettings}>
    <ThemeSwitch />
    <SafeModeSwitch />
    <LogoutButton />
  </div>
)

export default QuickSettings
