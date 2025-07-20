import React from "react"
import QuickSettings from "~/components/quick-settings/QuickSettings"
import Navigator from "~/components/navigator/Navigator"
import smallLogo from "~/images/small-logo.svg"
import styles from "./Header.module.css"


const Header = () => (
  <div className={styles.header}>
    <HeaderLogo />
    <Navigator />
    <QuickSettings/>
  </div>
)

const HeaderLogo = () =>
  <div className={styles.headerLogo}>
    <img src={smallLogo} alt="small logo" className={styles.smallLogo}/>
    <div className={styles.logoText}>Video Downloader</div>
  </div>

export default Header
