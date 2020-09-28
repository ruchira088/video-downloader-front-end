import VideoMetadata from "./VideoMetadata";
import FileResource from "./FileResource";

export default interface Video {
    readonly videoMetadata: VideoMetadata
    readonly fileResource: FileResource
}
