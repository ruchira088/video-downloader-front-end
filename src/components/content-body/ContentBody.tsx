import React from "react"
import {Route, Switch} from "react-router-dom"
import ServiceInformation from "pages/service-information/ServiceInformation"
import Scheduling from "pages/scheduling/Scheduling";
import Videos from "pages/videos/Videos";
import VideoPage from "pages/videos/video-page/VideoPage";
import ActiveDownloads from "pages/scheduling/ActiveDownloads";
import styles from "./ContentBody.module.css"

export default () => (
    <div className={styles.contentBody}>
        <Switch>
            <Route exact path="/">
                <Videos/>
            </Route>
            <Route path="/video/:videoId">
                <VideoPage/>
            </Route>
            <Route path="/service-information">
                <ServiceInformation/>
            </Route>
            <Route path="/schedule">
                <Scheduling/>
            </Route>
            <Route path="/active">
                <ActiveDownloads/>
            </Route>
            <Route path="*">
            </Route>
        </Switch>
    </div>
)
