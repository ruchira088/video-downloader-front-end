import axios, {AxiosInstance} from "axios";
import {Maybe} from "monet";
import configuration from "services/Configuration";
import SearchResult from "services/models/ListResult";
import Video from "services/models/Video";

const axiosClient: AxiosInstance = axios.create({baseURL: configuration.apiService})

export const searchVideos =
    (searchTerm: Maybe<string>, pageNumber: number, pageSize: number): Promise<SearchResult<Video>> =>
        axiosClient.get(`/videos/search?page-number=${pageNumber}&page-size=${pageSize}${searchTerm.fold(String())(term => `&search-term=${term}`)}`)
            .then(({data}) => data)

export const fetchVideoById = (videoId: string): Promise<Video> =>
    axiosClient.get(`/videos/id/${videoId}`).then(({data}) => data)
