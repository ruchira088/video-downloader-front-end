import React from "react"
import {Link} from "react-router-dom"
import {Grid} from "@material-ui/core";
import styles from "./Navigator.module.css"

interface NavigationTab {
    label: string
    path: string
}

const navigationTabs: NavigationTab[] = [
        {label: "Videos", path: "/"},
        {label: "Schedule", path: "/schedule"},
        {label: "Active Downloads", path: "/active"},
        {label: "Service Information", path: "/service-information"}
    ]

export default () => (
    <Grid container className={styles.navigator}>
        {
            navigationTabs
                .map((navigationTab, index) =>
                    <Grid item xs={3} key={index} className={styles.navigatorTab}>
                        <Link to={navigationTab.path}>
                            {navigationTab.label}
                        </Link>
                    </Grid>
                )
        }
    </Grid>
)
