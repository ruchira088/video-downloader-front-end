import React, {type FC} from "react"
import {type ApplicationContext} from "~/context/ApplicationContext"
import QuickSettings from "~/components/quick-settings/QuickSettings"
import Navigator from "~/components/navigator/Navigator"
import smallLogo from "~/images/small-logo.svg"
import styles from "./Header.module.css"

type HeaderProps = {
  readonly setApplicationContext: (applicationContext: ApplicationContext) => void
}

const Header: FC<HeaderProps> = props => (
  <div className={styles.header}>
    <HeaderLogo />
    <Navigator />
    <QuickSettings {...props} />
  </div>
)

const HeaderLogo = () =>
  <div className={styles.headerLogo}>
    <img src={smallLogo} alt="small logo" className={styles.smallLogo}/>
    <div className={styles.logoText}>Video Downloader</div>
  </div>

export default Header
