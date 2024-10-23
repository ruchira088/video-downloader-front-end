import { axiosClient } from "../http/HttpClient"
import { parseVideoWatchHistory } from "../../utils/ResponseParser"
import { VideoWatchHistory } from "../../models/VideoWatchHistory"

export const getVideoHistory = (pageNumber: number, pageSize: number): Promise<VideoWatchHistory[]> =>
  axiosClient.get(`/videos/history?page-number=${pageNumber}&page-size=${pageSize}`)
    .then(({data}) => data.results.map(parseVideoWatchHistory))