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

/** A drag's effect on a playlist's order; a no-op if either video is gone. */
type PlaylistMove = (playlist: Playlist) => Playlist

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

  // The last playlist the server confirmed, kept in step with `playlist` but readable without
  // waiting for a render — a queued mutation must see the result of the one before it. It
  // deliberately skips optimistic reorders, which are display-only until the server agrees.
  const confirmedPlaylist = useRef<Option<Playlist>>(None.of())
  const pendingMutation = useRef<Promise<void>>(Promise.resolve())

  // Drags shown on screen whose reorder is still waiting its turn in the queue. They are
  // re-applied over every confirmed playlist, so an earlier change landing doesn't snap them back.
  const pendingMoves = useRef<ReadonlyArray<PlaylistMove>>([])

  const withPendingMoves = (confirmed: Playlist): Playlist =>
    pendingMoves.current.reduce((current, move) => move(current), confirmed)

  const applyPlaylist = (confirmed: Option<Playlist>) => {
    confirmedPlaylist.current = confirmed
    setPlaylist(confirmed.map(withPendingMoves))
  }

  // Every change answers with the whole playlist, so concurrent changes would overwrite each
  // other (lost videos, a reverted title). Run them one at a time, each on the latest playlist.
  const enqueueMutation = (mutation: (current: Playlist) => Promise<void>): Promise<void> => {
    const result = pendingMutation.current.then(() =>
      confirmedPlaylist.current.fold(() => Promise.resolve(), mutation)
    )
    pendingMutation.current = result.catch(() => {})
    return result
  }

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
      confirmedPlaylist.current = Some.of(data)
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

  // Refetches without the page-level spinner, which would unmount the page (and any open
  // player or search panel). If that fails too, fall back to the last order the server confirmed.
  const refreshPlaylist = async () => {
    try {
      applyPlaylist(Some.of(await fetchPlaylistById(playlistId)))
    } catch (error) {
      console.error("Failed to refresh the playlist", error)
      setPlaylist(confirmedPlaylist.current.map(withPendingMoves))
    }
  }

  const handleDragEnd = (event: DragEndEvent): Promise<void> => {
    const { active, over } = event

    if (!over || active.id === over.id) return Promise.resolve()

    const activeId = String(active.id)
    const overId = String(over.id)

    const moved = (current: Playlist): Option<Playlist> => {
      const oldIndex = current.videos.findIndex(v => v.videoMetadata.id === activeId)
      const newIndex = current.videos.findIndex(v => v.videoMetadata.id === overId)

      return oldIndex === -1 || newIndex === -1
        ? None.of()
        : Some.of({ ...current, videos: arrayMove(current.videos, oldIndex, newIndex) })
    }

    const move: PlaylistMove = current => moved(current).getOrElse(() => current)

    // Show the drop immediately; the server call may have to wait behind other changes.
    pendingMoves.current = [...pendingMoves.current, move]
    setPlaylist(prev => prev.map(move))

    return enqueueMutation(current => {
      // From here the move is carried by the request itself rather than re-applied on top.
      pendingMoves.current = pendingMoves.current.filter(pendingMove => pendingMove !== move)

      return moved(current).fold(
        () => Promise.resolve(),
        async reordered => {
          try {
            applyPlaylist(
              Some.of(await reorderPlaylistVideos(playlistId, reordered.videos.map(v => v.videoMetadata.id)))
            )
          } catch (error) {
            notifyError("Failed to reorder the playlist", error)
            await refreshPlaylist()
          }
        }
      )
    })
  }

  const handleUpdateTitle = (title: string): Promise<void> =>
    enqueueMutation(async () => {
      try {
        await updatePlaylist(playlistId, { title })
        applyPlaylist(confirmedPlaylist.current.map(p => ({ ...p, title })))
      } catch (error) {
        notifyError("Failed to rename the playlist", error)
      }
    })

  const handleDelete = async () => {
    try {
      await deletePlaylist(playlistId)
      void navigate("/playlists")
    } catch (error) {
      notifyError("Failed to delete the playlist", error)
    }
  }

  const handleRemoveVideo = (videoId: string): Promise<void> =>
    enqueueMutation(async currentPlaylist => {
      try {
        const updatedPlaylist = await removeVideoFromPlaylist(currentPlaylist, videoId)
        applyPlaylist(Some.of(updatedPlaylist))
        playback.videoRemoved(videoId)
      } catch (error) {
        notifyError("Failed to remove the video from the playlist", error)
      }
    })

  const handleAddVideo = (videoId: string): Promise<void> =>
    enqueueMutation(async currentPlaylist => {
      try {
        const updatedPlaylist = await addVideoToPlaylist(currentPlaylist, videoId)
        applyPlaylist(Some.of(updatedPlaylist))
        void Option.fromNullable(updatedPlaylist.videos.find(v => v.videoMetadata.id === videoId)).forEach(
          playback.videoAdded
        )
      } catch (error) {
        notifyError("Failed to add the video to the playlist", error)
      }
    })

  const handleAlbumArtUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingAlbumArt(true)
    await enqueueMutation(async () => {
      try {
        const updatedPlaylist = await uploadAlbumArt(playlistId, file)
        applyPlaylist(Some.of(updatedPlaylist))
      } catch (error) {
        notifyError("Failed to upload the album art", error)
      }
    })
    setIsUploadingAlbumArt(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleRemoveAlbumArt = (): Promise<void> =>
    enqueueMutation(async () => {
      try {
        const updatedPlaylist = await removeAlbumArt(playlistId)
        applyPlaylist(Some.of(updatedPlaylist))
      } catch (error) {
        notifyError("Failed to remove the album art", error)
      }
    })

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
