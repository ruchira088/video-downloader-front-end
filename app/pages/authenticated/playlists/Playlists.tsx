import React, { useState } from "react"
import { Link } from "react-router"
import { Button } from "@mui/material"
import Add from "@mui/icons-material/Add"
import Helmet from "~/components/helmet/Helmet"
import { Playlist } from "~/models/Playlist"
import { fetchPlaylists } from "~/services/playlist/PlaylistService"
import { PlaylistSortBy } from "~/models/PlaylistSortBy"
import { Ordering } from "~/models/Ordering"
import { None } from "~/types/Option"
import PlaylistCard from "./components/PlaylistCard"
import CreatePlaylistDialog from "./components/CreatePlaylistDialog"
import InfiniteScroll from "~/components/infinite-scroll/InfiniteScroll"
import { usePaginatedFetch } from "~/components/infinite-scroll/usePaginatedFetch"

import styles from "./Playlists.module.scss"

const PAGE_SIZE = 50

const Playlists = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { isLoading, hasMore, loadMore, hasError, retry } = usePaginatedFetch<Playlist>(
    pageNumber =>
      fetchPlaylists(None.of(), pageNumber, PAGE_SIZE, PlaylistSortBy.CreatedAt, Ordering.Descending),
    newPlaylists => setPlaylists(prev => [...prev, ...newPlaylists]),
    { pageSize: PAGE_SIZE }
  )

  const handlePlaylistCreated = (playlist: Playlist) => {
    setPlaylists(prev => [playlist, ...prev])
    setIsDialogOpen(false)
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
      <InfiniteScroll
        loadMore={loadMore}
        hasMore={hasMore}
        isLoading={isLoading}
        hasError={hasError}
        onRetry={retry}
        endMessage={playlists.length > 0 ? "No more playlists" : undefined}
        className={styles.playlistsGrid}
      >
        {playlists.map(playlist => (
          <Link
            to={`/playlists/${playlist.id}`}
            key={playlist.id}
            className={styles.playlistLink}
          >
            <PlaylistCard playlist={playlist} />
          </Link>
        ))}
      </InfiniteScroll>
      {playlists.length === 0 && !isLoading && !hasError && (
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
