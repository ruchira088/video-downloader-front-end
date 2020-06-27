import axios, {AxiosInstance} from "axios";
import {Maybe} from "monet";
import configuration from "services/Configuration";
import SearchResult from "services/models/ListResult";
import Video from "services/models/Video";
import {parseSnapshot, parseVideo, parseVideoAnalysisResult, searchResultParser} from "services/models/ResponseParser"
import {VideoAnalysisResult} from "../models/VideoAnalysisResult";
import {Snapshot} from "../models/Snapshot";

export type VideoJson = object

const axiosClient: AxiosInstance = axios.create({baseURL: configuration.apiService})

export const searchVideos =
    (searchTerm: Maybe<string>, pageNumber: number, pageSize: number): Promise<SearchResult<VideoJson>> =>
        axiosClient.get(`/videos/search?page-number=${pageNumber}&page-size=${pageSize}${searchTerm.fold(String())(term => `&search-term=${term}`)}`)
            .then(({data}) => searchResultParser(json => json)(data))

export const fetchVideoById = (videoId: string): Promise<Video> =>
    axiosClient.get(`/videos/id/${videoId}`).then(({data}) => parseVideo(data))

export const fetchVideoSnapshots = (videoId: string): Promise<Snapshot[]> =>
    axiosClient.get(`/videos/id/${videoId}/snapshots`).then(({data}) => data.results.map(parseSnapshot))

export const analyze = (url: string): Promise<VideoAnalysisResult> =>
    axiosClient.post("/videos/analyze", {url}).then(({data}) => parseVideoAnalysisResult(data))
