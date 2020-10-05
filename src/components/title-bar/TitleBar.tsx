import React from "react";
import Grid from "@material-ui/core/Grid";
import QuickSettings, {
  QuickSettings as Settings,
} from "components/quick-settings/QuickSettings";
import styles from "./TitleBar.module.css";
import Navigator from "components/navigator/Navigator";

export default (quickSettings: Settings) => (
  <Grid container className={styles.titleBar}>
    <Grid item xs={2} className={styles.logo}>
      <img
        src="/small-logo.svg"
        alt="small logo"
        className={styles.smallLogo}
      />
      <div className={styles.logoText}>Video Downloader</div>
    </Grid>
    <Grid item xs={8}>
      <Navigator />
    </Grid>
    <Grid item xs={2} className={styles.quickSettings}>
      <QuickSettings {...quickSettings} />
    </Grid>
  </Grid>
);
