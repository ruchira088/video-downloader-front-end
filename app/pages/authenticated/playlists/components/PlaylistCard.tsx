import React, { type FC } from "react"
import QueueMusic from "@mui/icons-material/QueueMusic"
import { Playlist } from "~/models/Playlist"
import Timestamp from "~/components/timestamp/Timestamp"
import { useApplicationConfiguration } from "~/providers/ApplicationConfigurationProvider"
import { imageUrl } from "~/services/asset/AssetService"

import styles from "./PlaylistCard.module.scss"

type PlaylistCardProps = {
  readonly playlist: Playlist
}

const PlaylistCard: FC<PlaylistCardProps> = ({ playlist }) => {
  const { safeMode } = useApplicationConfiguration()

  return (
  <div className={styles.playlistCard}>
    {
      playlist.albumArt
        .map(albumArt =>
          <img
            src={imageUrl(albumArt, safeMode)}
            alt={`${playlist.title} cover`}
            className={styles.coverImage}
          />
        )
        .getOrElse(() =>
          <div className={styles.iconContainer}>
            <QueueMusic className={styles.icon} />
          </div>
        )
    }
    <div className={styles.content}>
      <h3 className={styles.name}>{playlist.title}</h3>
      {playlist.description && (
        <p className={styles.description}>{playlist.description}</p>
      )}
      <div className={styles.meta}>
        <span className={styles.videoCount}>
          {playlist.videos.length} {playlist.videos.length === 1 ? "video" : "videos"}
        </span>
        <Timestamp timestamp={playlist.createdAt} className={styles.timestamp} />
      </div>
    </div>
  </div>
  )
}

export default PlaylistCard
