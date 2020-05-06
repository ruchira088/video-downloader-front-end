import axios, {AxiosInstance} from "axios";
import configuration from "../Configuration";
import {Maybe} from "monet";
import SearchResult from "../models/ListResult";
import Video from "../models/Video";

const axiosClient: AxiosInstance = axios.create({ baseURL: configuration.apiService })

export const searchVideos =
    (searchTerm: Maybe<string>, pageNumber: number, pageSize: number): Promise<SearchResult<Video>> =>
        axiosClient.get(`/videos/search?page-number=${pageNumber}&page-size=${pageSize}${searchTerm.fold(String())(term => `&search-term=${term}`)}`)
            .then(({ data }) => data)
