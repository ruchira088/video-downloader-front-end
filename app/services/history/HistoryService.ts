import { axiosClient } from "../http/HttpClient"
import { VideoWatchHistory } from "~/models/VideoWatchHistory"
import { ListResponse } from "~/models/ListResponse"

export const getVideoHistory = async (pageNumber: number, pageSize: number): Promise<VideoWatchHistory[]> => {
  const response = await axiosClient.get(`/videos/history?page-number=${pageNumber}&page-size=${pageSize}`)
  const history = ListResponse(VideoWatchHistory).parse(response.data).results

  return history
}