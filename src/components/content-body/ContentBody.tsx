import React from "react";
import { Route, Switch } from "react-router-dom";
import ServiceInformation from "pages/service-information/ServiceInformation";
import Videos from "pages/authenticated/videos/Videos";
import VideoPage from "pages/authenticated/videos/video-page/VideoPage";
import styles from "./ContentBody.module.css";
import ScheduleVideo from "pages/authenticated/schedule/Schedule";
import ScheduledVideos from "pages/authenticated/pending/ScheduledVideos";

export default () => (
  <div className={styles.contentBody}>
    <Switch>
      <Route exact path="/">
        <Videos />
      </Route>
      <Route path="/video/:videoId">
        <VideoPage />
      </Route>
      <Route path="/service-information">
        <ServiceInformation />
      </Route>
      <Route path="/schedule">
        <ScheduleVideo />
      </Route>
      <Route path="/pending">
        <ScheduledVideos />
      </Route>
      <Route path="*"></Route>
    </Switch>
  </div>
);
