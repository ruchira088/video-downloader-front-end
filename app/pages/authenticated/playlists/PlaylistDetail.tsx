import React, { useState, useRef } from "react"
import { useNavigate } from "react-router"
import { Button, IconButton, CircularProgress } from "@mui/material"
import Delete from "@mui/icons-material/Delete"
import PlayArrow from "@mui/icons-material/PlayArrow"
import ArrowBack from "@mui/icons-material/ArrowBack"
import Add from "@mui/icons-material/Add"
import Close from "@mui/icons-material/Close"
import AddPhotoAlternate from "@mui/icons-material/AddPhotoAlternate"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from "@dnd-kit/sortable"
import { Option } from "~/types/Option"
import { deletePlaylist } from "~/services/playlist/PlaylistService"
import { imageUrl } from "~/services/asset/AssetService"
import { useApplicationConfiguration } from "~/providers/ApplicationConfigurationProvider"
import { useNotification } from "~/providers/NotificationProvider"
import Helmet from "~/components/helmet/Helmet"
import EditableLabel from "~/components/editable-label/EditableLabel"
import PlaylistVideoCard from "./components/PlaylistVideoCard"
import VideoSearchPanel from "./components/VideoSearchPanel"
import PlaylistPlayer from "./components/PlaylistPlayer"
import DeletePlaylistDialog from "./components/DeletePlaylistDialog"
import { usePlaylistPlayback } from "./usePlaylistPlayback"
import { usePlaylistEdits } from "./usePlaylistEdits"
import type { Route } from "./+types/PlaylistDetail"

import styles from "./PlaylistDetail.module.scss"

const PlaylistDetail = (props: Route.ComponentProps) => {
  const navigate = useNavigate()
  const { safeMode } = useApplicationConfiguration()
  const { notifyError } = useNotification()
  const playlistId = props.params.playlistId
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showAddVideos, setShowAddVideos] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isUploadingAlbumArt, setIsUploadingAlbumArt] = useState(false)

  const edits = usePlaylistEdits(playlistId)
  const { playlist, isLoading, loadFailure, loadPlaylist } = edits

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const playback = usePlaylistPlayback(playlist.map(p => p.videos).getOrElse(() => []))

  const handleDragEnd = ({ active, over }: DragEndEvent): Promise<void> =>
    Option.fromNullable(over).fold(
      () => Promise.resolve(),
      target => edits.moveVideo(String(active.id), String(target.id))
    )

  const handleDelete = async () => {
    try {
      await deletePlaylist(playlistId)
      void navigate("/playlists")
    } catch (error) {
      notifyError("Failed to delete the playlist", error)
    }
  }

  // The play queue follows membership changes only once the server has confirmed them.
  const handleRemoveVideo = (videoId: string): Promise<void> =>
    edits.removeVideo(videoId).then(removed => {
      if (removed) playback.videoRemoved(videoId)
    })

  const handleAddVideo = (videoId: string): Promise<void> =>
    edits.addVideo(videoId).then(added => {
      void added.forEach(playback.videoAdded)
    })

  const handleAlbumArtUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingAlbumArt(true)
    await edits.replaceAlbumArt(file)
    setIsUploadingAlbumArt(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <CircularProgress aria-label="Loading playlist" />
      </div>
    )
  }

  return playlist
    .map(p => (
      <div className={styles.playlistDetail} key={p.id}>
        <Helmet title={p.title} />

        <div className={styles.header}>
          <IconButton onClick={() => navigate("/playlists")} size="small" aria-label="Back to playlists">
            <ArrowBack />
          </IconButton>
          <div className={styles.titleContainer}>
            <EditableLabel textValue={p.title} onUpdateText={edits.updateTitle} />
          </div>
          <div className={styles.headerActions}>
            <IconButton
              onClick={() => setIsDeleteDialogOpen(true)}
              color="error"
              size="small"
              aria-label="Delete playlist"
            >
              <Delete />
            </IconButton>
          </div>
        </div>

        <div className={styles.albumArtSection}>
          {p.albumArt.fold(
            () => (
              <Button
                variant="outlined"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAlbumArt}
                startIcon={isUploadingAlbumArt ? <CircularProgress size={16} aria-label="Uploading album art" /> : <AddPhotoAlternate />}
              >
                {isUploadingAlbumArt ? "Uploading..." : "Add Album Art"}
              </Button>
            ),
            (albumArt) => (
              <div className={styles.albumArtPreview}>
                <img
                  src={imageUrl(albumArt, safeMode)}
                  alt={`${p.title} album art`}
                  className={styles.albumArtImage}
                />
                <div className={styles.albumArtActions}>
                  <Button
                    size="small"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAlbumArt}
                    startIcon={<AddPhotoAlternate />}
                  >
                    Change
                  </Button>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={edits.clearAlbumArt}
                    aria-label="Remove album art"
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </div>
              </div>
            )
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAlbumArtUpload}
            hidden
          />
        </div>

        <DeletePlaylistDialog
          isOpen={isDeleteDialogOpen}
          playlist={p}
          onClose={() => setIsDeleteDialogOpen(false)}
          onDelete={handleDelete}
        />

        {p.description.map(description => <p className={styles.description}>{description}</p>).toNullable()}

        <div className={styles.controls}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrow />}
            onClick={playback.play}
            disabled={playback.displayedVideos.length === 0}
          >
            Play
          </Button>
          <span className={styles.itemCount}>
            {p.videos.length} {p.videos.length === 1 ? "video" : "videos"}
          </span>
          <div className={styles.controlsSpacer} />
          <Button
            variant={showAddVideos ? "outlined" : "contained"}
            color={showAddVideos ? "inherit" : "secondary"}
            startIcon={showAddVideos ? <Close /> : <Add />}
            onClick={() => setShowAddVideos(!showAddVideos)}
          >
            {showAddVideos ? "Close" : "Add Videos"}
          </Button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className={styles.content}>
            <div className={styles.itemsSection}>
              <h3 className={styles.sectionTitle}>Playlist Videos</h3>
              {p.videos.length === 0 ? (
                <div className={styles.emptyItems}>
                  <p>No videos in this playlist yet.</p>
                  <p>Click "Add Videos" to search and add videos.</p>
                </div>
              ) : (
                <SortableContext
                  items={p.videos.map(v => v.videoMetadata.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className={styles.itemsList}>
                    {p.videos.map((video, index) => (
                      <PlaylistVideoCard
                        key={video.videoMetadata.id}
                        video={video}
                        index={index}
                        onRemove={() => handleRemoveVideo(video.videoMetadata.id)}
                        onPlay={() => playback.playVideo(video.videoMetadata.id)}
                        isCurrentlyPlaying={
                          playback.currentlyPlayingVideoId.toDefined() === video.videoMetadata.id
                        }
                      />
                    ))}
                  </div>
                </SortableContext>
              )}
            </div>

            {showAddVideos && (
              <div className={styles.searchSection}>
                <h3 className={styles.sectionTitle}>Add Videos</h3>
                <VideoSearchPanel
                  onVideoSelect={handleAddVideo}
                  existingVideoIds={p.videos.map(v => v.videoMetadata.id)}
                />
              </div>
            )}
          </div>
        </DndContext>

        {playback.isPlaying && playback.displayedVideos.length > 0 && (
          <PlaylistPlayer
            videos={playback.displayedVideos}
            currentIndex={playback.currentIndex}
            onNext={playback.next}
            onPrevious={playback.previous}
            onClose={playback.close}
            onIndexChange={playback.setCurrentIndex}
            isShuffled={playback.isShuffled}
            onShuffle={playback.toggleShuffle}
          />
        )}
      </div>
    ))
    .getOrElse(() => (
      <div className={styles.errorContainer}>
        <p>{loadFailure.toDefined() === "error" ? "Unable to load this playlist" : "Playlist not found"}</p>
        {loadFailure.toDefined() === "error" && <Button onClick={() => void loadPlaylist()}>Retry</Button>}
        <Button onClick={() => navigate("/playlists")}>
          Back to Playlists
        </Button>
      </div>
    ))
}

export default PlaylistDetail
