import React from "react"
import {Link} from "react-router"
import { Grid } from "@mui/material"
import styles from "./Navigator.module.css"

interface NavigationTab {
  readonly label: string
  readonly path: string
}

const navigationTabs: NavigationTab[] = [
  { label: "Videos", path: "/" },
  { label: "Schedule", path: "/schedule" },
  { label: "History", path: "/history" },
  { label: "Pending", path: "/pending" },
  { label: "Service Information", path: "/service-information" }
]

const Navigator = () => (
  <div className={styles.navigator}>
    {navigationTabs.map((navigationTab, index) => (
      <div key={index}>
        <Link to={navigationTab.path} className={styles.navigatorTab}>
          {navigationTab.label}
        </Link>
      </div>
    ))}
  </div>
)

export default Navigator
