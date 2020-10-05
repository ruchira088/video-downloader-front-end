import { VideoSite } from "./VideoSite";
import { Duration } from "moment";

export interface VideoAnalysisResult {
  readonly url: string;
  readonly videoSite: VideoSite;
  readonly title: string;
  readonly duration: Duration;
  readonly size: number;
  readonly thumbnail: string;
}
