import React from "react"
import {Link} from "react-router"
import styles from "./Navigator.module.css"

type NavigationTab = {
  readonly label: string
  readonly path: string
}

const navigationTabs: NavigationTab[] = [
  { label: "Videos", path: "/" },
  { label: "Schedule", path: "/schedule" },
  { label: "History", path: "/history" },
  { label: "Downloading", path: "/downloading" },
  { label: "Service Information", path: "/service-information" }
]

const Navigator = () => (
  <div className={styles.navigator}>
    {
      navigationTabs.map((navigationTab, index) => (
          <Link to={navigationTab.path} className={styles.navigatorTab} key={index}>
            {navigationTab.label}
          </Link>
        )
      )
    }
  </div>
)

export default Navigator
