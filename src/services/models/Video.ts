import VideoMetadata from "./VideoMetadata";
import FileResource from "./FileResource";

export default interface Video {
    videoMetadata: VideoMetadata
    fileResource: FileResource
}
