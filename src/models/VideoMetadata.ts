import FileResource from "./FileResource";
import { Duration } from "moment";
import { VideoSite } from "./VideoSite";

export default interface VideoMetadata {
  readonly url: string;
  readonly id: string;
  readonly videoSite: VideoSite;
  readonly title: string;
  readonly duration: Duration;
  readonly size: number;
  readonly thumbnail: FileResource;
}
