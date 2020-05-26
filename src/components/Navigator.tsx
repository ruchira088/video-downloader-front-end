import React from "react"
import {Link} from "react-router-dom"
import {Grid} from "@material-ui/core";

export default () => (
    <Grid container className="navigator">
        <Grid item xs={3}>
            <Link to="/">
                <div className="navigation-tab-name">Videos</div>
            </Link>
        </Grid>
        <Grid item xs={3}>
            <Link to="/schedule">
                <div className="navigation-tab-name">Schedule</div>
            </Link>
        </Grid>
        <Grid item xs={3}>
            <Link to="/active">
                <div className="navigation-tab-name">Active Downloads</div>
            </Link>
        </Grid>
        <Grid item xs={3}>
            <Link to="/service-information">
                <div className="navigation-tab-name">Service Information</div>
            </Link>
        </Grid>
    </Grid>
)
