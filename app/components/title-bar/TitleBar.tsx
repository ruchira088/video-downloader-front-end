import React, { type FC } from "react"
import { type ApplicationContext } from "~/context/ApplicationContext"
import QuickSettings from "~/components/quick-settings/QuickSettings"
import styles from "./TitleBar.module.css"
import Navigator from "~/components/navigator/Navigator"

type TitleBarProps = {
  readonly setApplicationContext: (applicationContext: ApplicationContext) => void
}

const TitleBar: FC<TitleBarProps> = props => (
  <div className={styles.titleBar}>
    <div className={styles.logo}>
      <img src="/small-logo.svg" alt="small logo" className={styles.smallLogo} />
      <div className={styles.logoText}>Video Downloader</div>
    </div>
    <div>
      <Navigator />
    </div>
    <div className={styles.quickSettings}>
      <QuickSettings {...props} />
    </div>
  </div>
)

export default TitleBar
