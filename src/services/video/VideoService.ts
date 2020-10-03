import {Maybe} from "monet";
import SearchResult from "models/ListResult";
import Video from "models/Video";
import {parseSnapshot, parseVideo, parseVideoAnalysisResult, searchResultParser} from "utils/ResponseParser"
import {VideoAnalysisResult} from "models/VideoAnalysisResult";
import {Snapshot} from "models/Snapshot";
import {axiosClient} from "services/http/HttpClient";

export const searchVideos =
    (searchTerm: Maybe<string>, pageNumber: number, pageSize: number): Promise<SearchResult<Video>> =>
        axiosClient.get(`/videos/search?page-number=${pageNumber}&page-size=${pageSize}${searchTerm.fold(String())(term => `&search-term=${term}`)}`)
            .then(({data}) => searchResultParser(parseVideo)(data))

export const fetchVideoById = (videoId: string): Promise<Video> =>
    axiosClient.get(`/videos/id/${videoId}`).then(({data}) => parseVideo(data))

export const fetchVideoSnapshots = (videoId: string): Promise<Snapshot[]> =>
    axiosClient.get(`/videos/id/${videoId}/snapshots`).then(({data}) => data.results.map(parseSnapshot))

export const analyze = (url: string): Promise<VideoAnalysisResult> =>
    axiosClient.post("/videos/analyze", {url}).then(({data}) => parseVideoAnalysisResult(data))

export const updateVideoTitle = (videoId: string, title: string): Promise<Video> =>
    axiosClient.patch(`/videos/id/${videoId}/metadata`, {title})
        .then(({data}) => parseVideo(data))
