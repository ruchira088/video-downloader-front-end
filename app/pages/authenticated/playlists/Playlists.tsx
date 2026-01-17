import React, { useEffect, useRef, useState } from "react"
import { Link } from "react-router"
import { Button } from "@mui/material"
import Add from "@mui/icons-material/Add"
import Helmet from "~/components/helmet/Helmet"
import { Playlist } from "~/models/Playlist"
import { fetchPlaylists } from "~/services/playlist/PlaylistService"
import { PlaylistSortBy } from "~/models/PlaylistSortBy"
import { PlaylistOrdering } from "~/models/PlaylistOrdering"
import { None } from "~/types/Option"
import PlaylistCard from "./components/PlaylistCard"
import CreatePlaylistDialog from "./components/CreatePlaylistDialog"

import styles from "./Playlists.module.scss"

const PAGE_SIZE = 50

const Playlists = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [pageNumber, setPageNumber] = useState(0)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const isLoading = useRef(false)
  const hasMore = useRef(true)

  const loadPlaylists = async () => {
    if (isLoading.current) return

    isLoading.current = true

    try {
      const newPlaylists = await fetchPlaylists(
        None.of(),
        pageNumber,
        PAGE_SIZE,
        PlaylistSortBy.CreatedAt,
        PlaylistOrdering.Descending
      )

      if (newPlaylists.length < PAGE_SIZE) {
        hasMore.current = false
      }

      setPlaylists(prev => [...prev, ...newPlaylists])
    } finally {
      isLoading.current = false
    }
  }

  useEffect(() => {
    loadPlaylists()
  }, [pageNumber])

  const handlePlaylistCreated = (playlist: Playlist) => {
    setPlaylists(prev => [playlist, ...prev])
    setIsDialogOpen(false)
  }

  const loadMore = () => {
    if (!isLoading.current && hasMore.current) {
      setPageNumber(prev => prev + 1)
    }
  }

  return (
    <div className={styles.playlistsPage}>
      <Helmet title="Playlists" />
      <div className={styles.header}>
        <h1 className={styles.title}>Playlists</h1>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => setIsDialogOpen(true)}
        >
          New Playlist
        </Button>
      </div>
      <div className={styles.playlistsGrid}>
        {playlists.map(playlist => (
          <Link
            to={`/playlists/${playlist.id}`}
            key={playlist.id}
            className={styles.playlistLink}
          >
            <PlaylistCard playlist={playlist} />
          </Link>
        ))}
      </div>
      {hasMore.current && playlists.length > 0 && (
        <div className={styles.loadMoreContainer}>
          <Button onClick={loadMore} variant="outlined">
            Load More
          </Button>
        </div>
      )}
      {playlists.length === 0 && !isLoading.current && (
        <div className={styles.emptyState}>
          <p>No playlists yet. Create your first playlist to get started!</p>
        </div>
      )}
      <CreatePlaylistDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onPlaylistCreated={handlePlaylistCreated}
      />
    </div>
  )
}

export default Playlists
