import React from "react"
import Grid from "@material-ui/core/Grid";
import QuickSettings, {QuickSettings as Settings} from "../../pages/settings/QuickSettings";
import styles from "./TitleBar.module.css"

export default (quickSettings: Settings) => (
    <Grid container className={styles.titleBar}>
        <Grid item xs={9}>
            <img src="/small-logo.svg" alt="small logo" className={styles.smallLogo}/>
            <span className={styles.logoText}>
                Video Downloader
                    <span className={styles.logoMotto}>watch it later...</span>
            </span>
        </Grid>
        <Grid item xs={3}>
            <QuickSettings {...quickSettings}/>
        </Grid>
    </Grid>
)
