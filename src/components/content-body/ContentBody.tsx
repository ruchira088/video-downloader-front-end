import React from "react"
import {Route, Switch} from "react-router-dom"
import ServiceInformation from "pages/service-information/ServiceInformation"
import Videos from "pages/videos/Videos";
import VideoPage from "pages/videos/video-page/VideoPage";
import ActiveDownloads from "pages/pending/ActiveDownloads";
import styles from "./ContentBody.module.css"
import ScheduleVideo from "pages/schedule/Schedule";
import ScheduledVideos from "pages/pending/ScheduledVideos";

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
                <ScheduleVideo/>
            </Route>
            <Route path="/pending">
                <ScheduledVideos/>
            </Route>
            <Route path="*">
            </Route>
        </Switch>
    </div>
)
