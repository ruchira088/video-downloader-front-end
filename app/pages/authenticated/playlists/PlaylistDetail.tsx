import React, { useEffect, useState, useCallback, useRef } from "react"
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
  verticalListSortingStrategy,
  arrayMove
} from "@dnd-kit/sortable"
import { Playlist } from "~/models/Playlist"
import { None, Option, Some } from "~/types/Option"
import {
  fetchPlaylistById,
  deletePlaylist,
  updatePlaylist,
  removeVideoFromPlaylist,
  reorderPlaylistVideos,
  addVideoToPlaylist,
  uploadAlbumArt,
  removeAlbumArt
} from "~/services/playlist/PlaylistService"
import { imageUrl } from "~/services/asset/AssetService"
import { httpStatusCode } from "~/services/http/HttpClient"
import { useApplicationConfiguration } from "~/providers/ApplicationConfigurationProvider"
import { useNotification } from "~/providers/NotificationProvider"
import Helmet from "~/components/helmet/Helmet"
import EditableLabel from "~/components/editable-label/EditableLabel"
import PlaylistVideoCard from "./components/PlaylistVideoCard"
import VideoSearchPanel from "./components/VideoSearchPanel"
import PlaylistPlayer from "./components/PlaylistPlayer"
import DeletePlaylistDialog from "./components/DeletePlaylistDialog"
import { usePlaylistPlayback } from "./usePlaylistPlayback"
import type { Route } from "./+types/PlaylistDetail"

import styles from "./PlaylistDetail.module.scss"

type LoadFailure = "not-found" | "error"

const PlaylistDetail = (props: Route.ComponentProps) => {
  const navigate = useNavigate()
  const { safeMode } = useApplicationConfiguration()
  const { notifyError } = useNotification()
  const playlistId = props.params.playlistId
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [playlist, setPlaylist] = useState<Option<Playlist>>(None.of())
  const [isLoading, setIsLoading] = useState(true)
  const [loadFailure, setLoadFailure] = useState<Option<LoadFailure>>(None.of())
  const [showAddVideos, setShowAddVideos] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isUploadingAlbumArt, setIsUploadingAlbumArt] = useState(false)

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

  const loadPlaylist = useCallback(async () => {
    setIsLoading(true)
    setLoadFailure(None.of())
    try {
      const data = await fetchPlaylistById(playlistId)
      setPlaylist(Some.of(data))
    } catch (error) {
      // Without this the promise rejects unhandled and the fallback below claims "not found"
      // for what may well be a network or server failure. A 404 really is "not found" and is
      // reported inline; anything else is a failure worth a notification and a retry.
      const isNotFound = !httpStatusCode(error).filter(status => status === 404).isEmpty()

      setLoadFailure(Some.of(isNotFound ? "not-found" : "error"))

      if (!isNotFound) {
        notifyError("Failed to load the playlist", error)
      }
    } finally {
      setIsLoading(false)
    }
  }, [playlistId, notifyError])

  useEffect(() => {
    // `loadPlaylist` setStates after an await, so this is an async load, not a cascading render.
    // oxlint-disable-next-line react/set-state-in-effect
    void loadPlaylist()
  }, [loadPlaylist])

  const playback = usePlaylistPlayback(playlist.map(p => p.videos).getOrElse(() => []))

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    const videos = playlist.map(p => p.videos).getOrElse(() => [])
    const oldIndex = videos.findIndex(v => v.videoMetadata.id === activeId)
    const newIndex = videos.findIndex(v => v.videoMetadata.id === overId)

    if (oldIndex === -1 || newIndex === -1) return

    const newVideos = arrayMove(videos, oldIndex, newIndex)

    setPlaylist(prev =>
      prev.map(p => ({
        ...p,
        videos: newVideos
      }))
    )

    try {
      await reorderPlaylistVideos(
        playlistId,
        newVideos.map(v => v.videoMetadata.id)
      )
    } catch (error) {
      notifyError("Failed to reorder the playlist", error)
      void loadPlaylist()
    }
  }

  const handleUpdateTitle = async (title: string) => {
    try {
      await updatePlaylist(playlistId, { title })
      setPlaylist(prev => prev.map(p => ({ ...p, title })))
    } catch (error) {
      notifyError("Failed to rename the playlist", error)
    }
  }

  const handleDelete = async () => {
    try {
      await deletePlaylist(playlistId)
      void navigate("/playlists")
    } catch (error) {
      notifyError("Failed to delete the playlist", error)
    }
  }

  const handleRemoveVideo = async (videoId: string) => {
    const currentPlaylist = playlist.toNullable()
    if (!currentPlaylist) return

    try {
      const updatedPlaylist = await removeVideoFromPlaylist(currentPlaylist, videoId)
      setPlaylist(Some.of(updatedPlaylist))
      playback.videoRemoved(videoId)
    } catch (error) {
      notifyError("Failed to remove the video from the playlist", error)
    }
  }

  const handleAddVideo = async (videoId: string) => {
    const currentPlaylist = playlist.toNullable()
    if (!currentPlaylist) return

    try {
      const updatedPlaylist = await addVideoToPlaylist(currentPlaylist, videoId)
      setPlaylist(Some.of(updatedPlaylist))
      void Option.fromNullable(updatedPlaylist.videos.find(v => v.videoMetadata.id === videoId)).forEach(
        playback.videoAdded
      )
    } catch (error) {
      notifyError("Failed to add the video to the playlist", error)
    }
  }

  const handleAlbumArtUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingAlbumArt(true)
    try {
      const updatedPlaylist = await uploadAlbumArt(playlistId, file)
      setPlaylist(Some.of(updatedPlaylist))
    } catch (error) {
      notifyError("Failed to upload the album art", error)
    } finally {
      setIsUploadingAlbumArt(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleRemoveAlbumArt = async () => {
    try {
      const updatedPlaylist = await removeAlbumArt(playlistId)
      setPlaylist(Some.of(updatedPlaylist))
    } catch (error) {
      notifyError("Failed to remove the album art", error)
    }
  }

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <CircularProgress />
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
            <EditableLabel textValue={p.title} onUpdateText={handleUpdateTitle} />
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
                startIcon={isUploadingAlbumArt ? <CircularProgress size={16} /> : <AddPhotoAlternate />}
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
                    onClick={handleRemoveAlbumArt}
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
