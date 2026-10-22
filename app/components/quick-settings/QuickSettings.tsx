import React from "react"
import styles from "./QuickSettings.module.scss"
import SafeModeSwitch from "./switches/SafeModeSwitch"
import WorkerStatusSwitch from "./switches/WorkerStatusSwitch"
import ThemeSwitch from "~/components/quick-settings/switches/ThemeSwitch"
import LogoutButton from "./switches/LogoutButton"
import { useIsAdmin } from "~/providers/AuthenticatedUserProvider"

const QuickSettings = () => {
  // Changing the worker status is admin-only on the server.
  const isAdmin = useIsAdmin()

  return (
    <div className={styles.quickSettings}>
      <ThemeSwitch />
      <SafeModeSwitch />
      {isAdmin && <WorkerStatusSwitch />}
      <LogoutButton />
    </div>
  )
}

export default QuickSettings
