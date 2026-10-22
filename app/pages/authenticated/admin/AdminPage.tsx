import React, { useEffect, useState } from "react"
import { Link } from "react-router"
import {
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from "@mui/material"
import Helmet from "~/components/helmet/Helmet"
import VideoScanButton from "~/components/scan/VideoScanButton"
import WorkerStatusSwitch from "~/components/quick-settings/switches/WorkerStatusSwitch"
import { VideoServiceSummary } from "~/models/VideoServiceSummary"
import { useNotification } from "~/providers/NotificationProvider"
import { reportError } from "~/services/ErrorReporting"
import { queueIncompleteDownloads, videoServiceSummary } from "~/services/video/VideoService"
import { None, type Option, Some } from "~/types/Option"
import { humanReadableDuration, humanReadableSize } from "~/utils/Formatter"
import styles from "./Admin.module.scss"

const LibrarySummary = () => {
  // None while loading; Some(None) when the summary could not be loaded.
  const [summary, setSummary] = useState<Option<Option<VideoServiceSummary>>>(None.of())

  useEffect(() => {
    videoServiceSummary()
      .then(result => setSummary(Some.of(Some.of(result))))
      .catch(error => {
        reportError("Failed to fetch the video service summary", error)
        setSummary(Some.of(None.of()))
      })
  }, [])

  return (
    <section className={styles.section} aria-labelledby="library-summary-heading">
      <h2 id="library-summary-heading">Library</h2>
      {
        summary.fold(
          () => <CircularProgress size={24} aria-label="Loading library summary" />,
          maybeSummary => maybeSummary.fold(
            () => <p className={styles.error}>Unable to load the library summary.</p>,
            ({ videoCount, totalSize, totalDuration, sites }) => (
              <>
                <dl className={styles.stats}>
                  <div><dt>Videos</dt><dd>{videoCount}</dd></div>
                  <div><dt>Total size</dt><dd>{humanReadableSize(totalSize)}</dd></div>
                  <div><dt>Total duration</dt><dd>{humanReadableDuration(totalDuration)}</dd></div>
                </dl>
                <div className={styles.sites}>
                  {sites.map(site => <Chip key={site} label={site} size="small" />)}
                </div>
              </>
            )
          )
        )
      }
    </section>
  )
}

const RequeueIncompleteDownloads = () => {
  const { notifySuccess, notifyError } = useNotification()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isRequeueing, setIsRequeueing] = useState(false)

  const onConfirm = async () => {
    setIsRequeueing(true)

    try {
      const videos = await queueIncompleteDownloads()
      notifySuccess(`Re-queued ${videos.length} ${videos.length === 1 ? "video" : "videos"}`)
    } catch (error) {
      notifyError("Failed to re-queue incomplete downloads", error)
    } finally {
      setIsRequeueing(false)
      setIsDialogOpen(false)
    }
  }

  return (
    <>
      <Button variant="outlined" color="warning" onClick={() => setIsDialogOpen(true)}>
        Re-queue Incomplete Downloads
      </Button>
      <Dialog open={isDialogOpen} onClose={isRequeueing ? undefined : () => setIsDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Re-queue incomplete downloads?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Up to 100 videos of 1 MiB or less are downloaded again. Their watch history and snapshots are deleted
            first, for every user.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)} disabled={isRequeueing}>Cancel</Button>
          <Button color="warning" variant="contained" onClick={onConfirm} disabled={isRequeueing}>
            {isRequeueing ? "Re-queueing..." : "Re-queue"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

const AdminPage = () => (
  <div className={styles.adminPage}>
    <Helmet title="Admin" />
    <LibrarySummary />

    <section className={styles.section} aria-labelledby="workers-heading">
      <h2 id="workers-heading">Workers</h2>
      <div className={styles.actions}>
        <WorkerStatusSwitch />
        <VideoScanButton />
      </div>
    </section>

    <section className={styles.section} aria-labelledby="maintenance-heading">
      <h2 id="maintenance-heading">Maintenance</h2>
      <div className={styles.actions}>
        <Button component={Link} to="/duplicates" variant="outlined">Review Duplicates</Button>
        <RequeueIncompleteDownloads />
      </div>
    </section>
  </div>
)

export default AdminPage
