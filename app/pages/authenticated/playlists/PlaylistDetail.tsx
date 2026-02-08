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
import { Video } from "~/models/Video"
import { None, type Option, Some } from "~/types/Option"
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
import { useApplicationConfiguration } from "~/providers/ApplicationConfigurationProvider"
import Helmet from "~/components/helmet/Helmet"
import EditableLabel from "~/components/editable-label/EditableLabel"
import PlaylistVideoCard from "./components/PlaylistVideoCard"
import VideoSearchPanel from "./components/VideoSearchPanel"
import PlaylistPlayer from "./components/PlaylistPlayer"
import type { Route } from "./+types/PlaylistDetail"

import styles from "./PlaylistDetail.module.scss"

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const PlaylistDetail = (props: Route.ComponentProps) => {
  const navigate = useNavigate()
  const { safeMode } = useApplicationConfiguration()
  const playlistId = props.params.playlistId
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [playlist, setPlaylist] = useState<Option<Playlist>>(None.of())
  const [isLoading, setIsLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isShuffled, setIsShuffled] = useState(false)
  const [shuffledVideos, setShuffledVideos] = useState<Video[]>([])
  const [showAddVideos, setShowAddVideos] = useState(false)
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

  const loadPlaylist = async () => {
    setIsLoading(true)
    try {
      const data = await fetchPlaylistById(playlistId)
      setPlaylist(Some.of(data))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPlaylist()
  }, [playlistId])

  const displayedVideos = playlist
    .map(p => (isShuffled ? shuffledVideos : p.videos))
    .getOrElse(() => [])

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
    } catch {
      loadPlaylist()
    }
  }

  const handleUpdateTitle = async (title: string) => {
    await updatePlaylist(playlistId, title)
    setPlaylist(prev => prev.map(p => ({ ...p, title })))
  }

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this playlist?")) {
      await deletePlaylist(playlistId)
      navigate("/playlists")
    }
  }

  const handleRemoveVideo = async (videoId: string) => {
    const currentPlaylist = playlist.toNullable()
    if (!currentPlaylist) return

    const updatedPlaylist = await removeVideoFromPlaylist(currentPlaylist, videoId)
    setPlaylist(Some.of(updatedPlaylist))
  }

  const handleAddVideo = async (videoId: string) => {
    const currentPlaylist = playlist.toNullable()
    if (!currentPlaylist) return

    const updatedPlaylist = await addVideoToPlaylist(currentPlaylist, videoId)
    setPlaylist(Some.of(updatedPlaylist))
  }

  const handleAlbumArtUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingAlbumArt(true)
    try {
      const updatedPlaylist = await uploadAlbumArt(playlistId, file)
      setPlaylist(Some.of(updatedPlaylist))
    } finally {
      setIsUploadingAlbumArt(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleRemoveAlbumArt = async () => {
    const updatedPlaylist = await removeAlbumArt(playlistId)
    setPlaylist(Some.of(updatedPlaylist))
  }

  const handlePlay = () => {
    if (displayedVideos.length > 0) {
      setCurrentIndex(0)
      setIsPlaying(true)
    }
  }

  const handleShuffle = () => {
    if (isShuffled) {
      setIsShuffled(false)
      setShuffledVideos([])
    } else {
      const videos = playlist.map(p => p.videos).getOrElse(() => [])
      setIsShuffled(true)
      setShuffledVideos(shuffleArray(videos))
    }
    setCurrentIndex(0)
  }

  const handlePlayFromIndex = useCallback((index: number) => {
    setCurrentIndex(index)
    setIsPlaying(true)
  }, [])

  const handleNextVideo = useCallback(() => {
    if (currentIndex < displayedVideos.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      setIsPlaying(false)
    }
  }, [currentIndex, displayedVideos.length])

  const handlePreviousVideo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }, [currentIndex])

  const handleClosePlayer = useCallback(() => {
    setIsPlaying(false)
  }, [])

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
          <IconButton onClick={() => navigate("/playlists")} size="small">
            <ArrowBack />
          </IconButton>
          <div className={styles.titleContainer}>
            <EditableLabel textValue={p.title} onUpdateText={handleUpdateTitle} />
          </div>
          <div className={styles.headerActions}>
            <IconButton onClick={handleDelete} color="error" size="small">
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
                  <IconButton size="small" color="error" onClick={handleRemoveAlbumArt}>
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

        {p.description && (
          <p className={styles.description}>{p.description}</p>
        )}

        <div className={styles.controls}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrow />}
            onClick={handlePlay}
            disabled={displayedVideos.length === 0}
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
                        onPlay={() => handlePlayFromIndex(index)}
                        isCurrentlyPlaying={isPlaying && currentIndex === index}
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

        {isPlaying && displayedVideos.length > 0 && (
          <PlaylistPlayer
            videos={displayedVideos}
            currentIndex={currentIndex}
            onNext={handleNextVideo}
            onPrevious={handlePreviousVideo}
            onClose={handleClosePlayer}
            onIndexChange={setCurrentIndex}
            isShuffled={isShuffled}
            onShuffle={handleShuffle}
          />
        )}
      </div>
    ))
    .getOrElse(() => (
      <div className={styles.errorContainer}>
        <p>Playlist not found</p>
        <Button onClick={() => navigate("/playlists")}>
          Back to Playlists
        </Button>
      </div>
    ))
}

export default PlaylistDetail
