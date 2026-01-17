import React from "react"
import QuickSettings from "~/components/quick-settings/QuickSettings"
import Navigator from "~/components/navigator/Navigator"
import smallLogo from "~/images/small-logo.svg"
import styles from "./Header.module.scss"
import { Link } from "react-router"


const Header = () => (
  <div className={styles.header}>
    <HeaderLogo />
    <Navigator />
    <QuickSettings/>
  </div>
)

const HeaderLogo = () =>
  <Link className={styles.headerLogo} to="/">
    <img src={smallLogo} alt="small logo" className={styles.smallLogo}/>
    <div className={styles.logoText}>Video Downloader</div>
  </Link>

export default Header
