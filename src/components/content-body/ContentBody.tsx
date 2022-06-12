import React from "react"
import { Route, Routes } from "react-router-dom"
import ServiceInformation from "pages/service-information/ServiceInformation"
import Videos from "pages/authenticated/videos/Videos"
import VideoPage from "pages/authenticated/videos/video-page/VideoPage"
import ScheduleVideo from "pages/authenticated/schedule/Schedule"
import ScheduledVideos from "pages/authenticated/pending/ScheduledVideos"
import ServerErrorPage from "pages/authenticated/server-error/ServerErrorPage"
import styles from "./ContentBody.module.css"

const ContentBody = () => (
  <div className={styles.contentBody}>
    <Routes>
      <Route path="/" element={<Videos />} />
      <Route path="/video/:videoId" element={<VideoPage />} />
      <Route path="/service-information" element={<ServiceInformation />} />
      <Route path="/schedule" element={<ScheduleVideo />} />
      <Route path="/pending" element={<ScheduledVideos />} />
      <Route path="/server-error" element={<ServerErrorPage />} />
      <Route path="*"></Route>
    </Routes>
  </div>
)

export default ContentBody
