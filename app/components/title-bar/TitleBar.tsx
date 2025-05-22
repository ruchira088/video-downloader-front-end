import React from "react"
import QuickSettings, { type Settings } from "~/components/quick-settings/QuickSettings"
import styles from "./TitleBar.module.css"
import Navigator from "~/components/navigator/Navigator"

const TitleBar = (settings: Settings) => (
  <div className={styles.titleBar}>
    <div className={styles.logo}>
      <img src="/small-logo.svg" alt="small logo" className={styles.smallLogo} />
      <div className={styles.logoText}>Video Downloader</div>
    </div>
    <div>
      <Navigator />
    </div>
    <div className={styles.quickSettings}>
      <QuickSettings {...settings} />
    </div>
  </div>
)

export default TitleBar
