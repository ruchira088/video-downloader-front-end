import axios from "axios";
import {Maybe} from "monet"
import configuration from "services/Configuration";
import ScheduledVideoDownload from "services/models/ScheduledVideoDownload";

const axiosClient = axios.create({baseURL: configuration.apiService})

export const active = (): EventSource => new EventSource(`${configuration.apiService}/schedule/active`)

export const scheduleVideo =
    (videoSiteUrl: string): Promise<ScheduledVideoDownload> =>
        axiosClient.post("/schedule", {url: videoSiteUrl})
            .then(({data}) => data)

export const fetchScheduledVideos =
    (searchTerm: Maybe<string>, pageNumber: number, pageSize: number): Promise<ScheduledVideoDownload[]> =>
        axiosClient.get(`/schedule/search?page-size=${pageSize}&page-number=${pageNumber}${searchTerm.fold(String())(term => `&search-term=${term}`)}`)
            .then(({data}) => data.results)
