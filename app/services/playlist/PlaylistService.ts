import { Playlist } from "~/models/Playlist"
import { ListResponse } from "~/models/ListResponse"
import { axiosClient } from "~/services/http/HttpClient"
import { zodParse } from "~/types/Zod"
import type { Option } from "~/types/Option"
import type { PlaylistSortBy } from "~/models/PlaylistSortBy"
import type { Ordering } from "~/models/Ordering"

/** Fields of a playlist that can be changed; anything omitted is left as it is. */
export type PlaylistUpdate = {
  readonly title?: string
  readonly description?: string
  readonly videoIds?: string[]
}

export const createPlaylist = async (title: string, description?: string): Promise<Playlist> => {
  const response = await axiosClient.post("/playlists", { title, description })

  return zodParse(Playlist, response.data)
}

export const fetchPlaylists = async (
  searchTerm: Option<string>,
  pageNumber: number,
  pageSize: number,
  sortBy: PlaylistSortBy,
  ordering: Ordering
): Promise<Playlist[]> => {
  const response = await axiosClient.get("/playlists", {
    params: {
      searchTerm: searchTerm.toNullable(),
      pageNumber,
      pageSize,
      sortBy,
      order: ordering
    }
  })

  return zodParse(ListResponse(Playlist), response.data).results
}

export const fetchPlaylistById = async (playlistId: string): Promise<Playlist> => {
  const response = await axiosClient.get(`/playlists/id/${playlistId}`)

  return zodParse(Playlist, response.data)
}

export const updatePlaylist = async (playlistId: string, update: PlaylistUpdate): Promise<Playlist> => {
  const response = await axiosClient.put(`/playlists/id/${playlistId}`, {
    title: update.title,
    description: update.description,
    videoIds: update.videoIds
  })

  return zodParse(Playlist, response.data)
}

export const deletePlaylist = async (playlistId: string): Promise<Playlist> => {
  const response = await axiosClient.delete(`/playlists/id/${playlistId}`)

  return zodParse(Playlist, response.data)
}

const videoIdsOf = (playlist: Playlist): string[] => playlist.videos.map(video => video.videoMetadata.id)

export const addVideoToPlaylist = (playlist: Playlist, videoId: string): Promise<Playlist> =>
  updatePlaylist(playlist.id, { videoIds: [...videoIdsOf(playlist), videoId] })

export const removeVideoFromPlaylist = (playlist: Playlist, videoId: string): Promise<Playlist> =>
  updatePlaylist(playlist.id, { videoIds: videoIdsOf(playlist).filter(id => id !== videoId) })

export const reorderPlaylistVideos = (playlistId: string, videoIds: string[]): Promise<Playlist> =>
  updatePlaylist(playlistId, { videoIds })

export const uploadAlbumArt = async (playlistId: string, file: File): Promise<Playlist> => {
  const formData = new FormData()
  formData.append("file", file)

  const response = await axiosClient.put(`/playlists/id/${playlistId}/album-art`, formData)

  return zodParse(Playlist, response.data)
}

export const removeAlbumArt = async (playlistId: string): Promise<Playlist> => {
  const response = await axiosClient.delete(`/playlists/id/${playlistId}/album-art`)

  return zodParse(Playlist, response.data)
}
