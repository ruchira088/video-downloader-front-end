import React from "react"
import { Link } from "react-router-dom"
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
  <Grid container className={styles.navigator}>
    {navigationTabs.map((navigationTab, index) => (
      <Grid item xs={2} key={index}>
        <Link to={navigationTab.path} className={styles.navigatorTab}>
          {navigationTab.label}
        </Link>
      </Grid>
    ))}
  </Grid>
)

export default Navigator
