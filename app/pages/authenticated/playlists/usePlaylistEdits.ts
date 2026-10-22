import { useCallback, useEffect, useRef, useState } from "react"
import { arrayMove } from "@dnd-kit/sortable"
import { Playlist } from "~/models/Playlist"
import { Video } from "~/models/Video"
import { None, Option, Some } from "~/types/Option"
import {
  fetchPlaylistById,
  updatePlaylist,
  removeVideoFromPlaylist,
  reorderPlaylistVideos,
  addVideoToPlaylist,
  uploadAlbumArt,
  removeAlbumArt
} from "~/services/playlist/PlaylistService"
import { httpStatusCode } from "~/services/http/HttpClient"
import { useNotification } from "~/providers/NotificationProvider"
import { reportError } from "~/services/ErrorReporting"

export type LoadFailure = "not-found" | "error"

/** A drag's effect on a playlist's order; a no-op if either video is gone. */
type PlaylistMove = (playlist: Playlist) => Playlist

/**
 * Loads a playlist and owns every change made to it: renaming, adding, removing and reordering
 * videos, and replacing or clearing its album art.
 *
 * Every change answers with the whole playlist, so concurrent changes would overwrite each other
 * (lost videos, a reverted title). They are queued and run one at a time, each on the playlist
 * the server last confirmed. A failed change is reported through the notification context and
 * leaves the playlist as it was; the returned promises never reject.
 *
 * `addVideo` and `removeVideo` resolve with what happened so the caller can mirror it elsewhere
 * (e.g. into a shuffled play queue): the added video, or whether the removal went through.
 */
export const usePlaylistEdits = (playlistId: string) => {
  const { notifyError } = useNotification()

  const [playlist, setPlaylist] = useState<Option<Playlist>>(None.of())
  const [isLoading, setIsLoading] = useState(true)
  const [loadFailure, setLoadFailure] = useState<Option<LoadFailure>>(None.of())

  // The last playlist the server confirmed, kept in step with `playlist` but readable without
  // waiting for a render — a queued mutation must see the result of the one before it. It
  // deliberately skips optimistic reorders, which are display-only until the server agrees.
  const confirmedPlaylist = useRef<Option<Playlist>>(None.of())
  const pendingMutation = useRef<Promise<unknown>>(Promise.resolve())

  // Drags shown on screen whose reorder is still waiting its turn in the queue. They are
  // re-applied over every confirmed playlist, so an earlier change landing doesn't snap them back.
  const pendingMoves = useRef<ReadonlyArray<PlaylistMove>>([])

  const withPendingMoves = (confirmed: Playlist): Playlist =>
    pendingMoves.current.reduce((current, move) => move(current), confirmed)

  const applyPlaylist = (confirmed: Option<Playlist>) => {
    confirmedPlaylist.current = confirmed
    setPlaylist(confirmed.map(withPendingMoves))
  }

  // Runs `mutation` on the latest confirmed playlist once every earlier one has settled, or
  // resolves with `ifNotLoaded` if there is no playlist to change.
  const enqueueMutation = <A>(mutation: (current: Playlist) => Promise<A>, ifNotLoaded: A): Promise<A> => {
    const result = pendingMutation.current.then(() =>
      confirmedPlaylist.current.fold(() => Promise.resolve(ifNotLoaded), mutation)
    )
    pendingMutation.current = result.catch(() => {})
    return result
  }

  const loadPlaylist = useCallback(async () => {
    setIsLoading(true)
    setLoadFailure(None.of())
    try {
      const data = await fetchPlaylistById(playlistId)
      confirmedPlaylist.current = Some.of(data)
      setPlaylist(Some.of(data))
    } catch (error) {
      // Without this the promise rejects unhandled and the page claims "not found" for what may
      // well be a network or server failure. A 404 really is "not found" and is reported inline;
      // anything else is a failure worth a notification and a retry.
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

  // Refetches without the page-level spinner, which would unmount the page (and any open
  // player or search panel). If that fails too, fall back to the last order the server confirmed.
  const refreshPlaylist = async () => {
    try {
      applyPlaylist(Some.of(await fetchPlaylistById(playlistId)))
    } catch (error) {
      reportError("Failed to refresh the playlist", error)
      setPlaylist(confirmedPlaylist.current.map(withPendingMoves))
    }
  }

  /** Moves `activeId` to where `overId` is; a no-op if they are the same or either is unknown. */
  const moveVideo = (activeId: string, overId: string): Promise<void> => {
    if (activeId === overId) return Promise.resolve()

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
    }, undefined)
  }

  const updateTitle = (title: string): Promise<void> =>
    enqueueMutation(async () => {
      try {
        await updatePlaylist(playlistId, { title })
        applyPlaylist(confirmedPlaylist.current.map(p => ({ ...p, title })))
      } catch (error) {
        notifyError("Failed to rename the playlist", error)
      }
    }, undefined)

  /** Resolves `true` once the server has removed the video, `false` if it was not removed. */
  const removeVideo = (videoId: string): Promise<boolean> =>
    enqueueMutation(async currentPlaylist => {
      try {
        applyPlaylist(Some.of(await removeVideoFromPlaylist(currentPlaylist, videoId)))
        return true
      } catch (error) {
        notifyError("Failed to remove the video from the playlist", error)
        return false
      }
    }, false)

  /** Resolves with the video as the server added it, or `None` if it was not added. */
  const addVideo = (videoId: string): Promise<Option<Video>> =>
    enqueueMutation(async (currentPlaylist): Promise<Option<Video>> => {
      try {
        const updatedPlaylist = await addVideoToPlaylist(currentPlaylist, videoId)
        applyPlaylist(Some.of(updatedPlaylist))
        return Option.fromNullable(updatedPlaylist.videos.find(v => v.videoMetadata.id === videoId))
      } catch (error) {
        notifyError("Failed to add the video to the playlist", error)
        return None.of()
      }
    }, None.of())

  const replaceAlbumArt = (file: File): Promise<void> =>
    enqueueMutation(async () => {
      try {
        applyPlaylist(Some.of(await uploadAlbumArt(playlistId, file)))
      } catch (error) {
        notifyError("Failed to upload the album art", error)
      }
    }, undefined)

  const clearAlbumArt = (): Promise<void> =>
    enqueueMutation(async () => {
      try {
        applyPlaylist(Some.of(await removeAlbumArt(playlistId)))
      } catch (error) {
        notifyError("Failed to remove the album art", error)
      }
    }, undefined)

  return {
    playlist,
    isLoading,
    loadFailure,
    loadPlaylist,
    updateTitle,
    addVideo,
    removeVideo,
    moveVideo,
    replaceAlbumArt,
    clearAlbumArt
  }
}
