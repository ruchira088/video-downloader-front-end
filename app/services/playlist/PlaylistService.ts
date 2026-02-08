import { Playlist } from "~/models/Playlist"
import { ListResponse } from "~/models/ListResponse"
import { axiosClient } from "~/services/http/HttpClient"
import { zodParse } from "~/types/Zod"
import type { Option } from "~/types/Option"
import type { PlaylistSortBy } from "~/models/PlaylistSortBy"
import type { PlaylistOrdering } from "~/models/PlaylistOrdering"

export const createPlaylist = async (
  title: string,
  description?: string
): Promise<Playlist> => {
  const response = await axiosClient.post("/playlists", { title, description })
  const playlist = zodParse(Playlist, response.data)

  return playlist
}

export const fetchPlaylists = async (
  searchTerm: Option<string>,
  pageNumber: number,
  pageSize: number,
  sortBy: PlaylistSortBy,
  ordering: PlaylistOrdering
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
  const playlists = zodParse(ListResponse(Playlist), response.data)

  return playlists.results
}

export const fetchPlaylistById = async (
  playlistId: string
): Promise<Playlist> => {
  const response = await axiosClient.get(`/playlists/id/${playlistId}`)
  const playlist = zodParse(Playlist, response.data)

  return playlist
}

export const updatePlaylist = async (
  playlistId: string,
  title?: string,
  description?: string,
  videoIds?: string[]
): Promise<Playlist> => {
  const response = await axiosClient.put(`/playlists/id/${playlistId}`, {
    title,
    description,
    videoIds
  })
  const playlist = zodParse(Playlist, response.data)

  return playlist
}

export const deletePlaylist = async (playlistId: string): Promise<Playlist> => {
  const response = await axiosClient.delete(`/playlists/id/${playlistId}`)
  const playlist = zodParse(Playlist, response.data)

  return playlist
}

export const addVideoToPlaylist = async (
  playlist: Playlist,
  videoId: string
): Promise<Playlist> => {
  const existingVideoIds = playlist.videos.map(v => v.videoMetadata.id)
  const newVideoIds = [...existingVideoIds, videoId]

  return updatePlaylist(playlist.id, undefined, undefined, newVideoIds)
}

export const removeVideoFromPlaylist = async (
  playlist: Playlist,
  videoId: string
): Promise<Playlist> => {
  const newVideoIds = playlist.videos
    .map(v => v.videoMetadata.id)
    .filter(id => id !== videoId)

  return updatePlaylist(playlist.id, undefined, undefined, newVideoIds)
}

export const reorderPlaylistVideos = async (
  playlistId: string,
  videoIds: string[]
): Promise<Playlist> => {
  return updatePlaylist(playlistId, undefined, undefined, videoIds)
}

export const uploadAlbumArt = async (
  playlistId: string,
  file: File
): Promise<Playlist> => {
  const formData = new FormData()
  formData.append("file", file)

  const response = await axiosClient.put(
    `/playlists/id/${playlistId}/album-art`,
    formData
  )
  const playlist = zodParse(Playlist, response.data)

  return playlist
}

export const removeAlbumArt = async (playlistId: string): Promise<Playlist> => {
  const response = await axiosClient.delete(`/playlists/id/${playlistId}/album-art`)
  const playlist = zodParse(Playlist, response.data)

  return playlist
}
