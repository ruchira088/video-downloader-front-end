import {VideoSite} from "./VideoSite";
import {Duration} from "moment";

export interface VideoAnalysisResult {
    url: string
    videoSite: VideoSite
    title: string
    duration: Duration
    size: number
    thumbnail: string
}
