import React, {useState} from "react"
import {GridList, GridListTile} from "@material-ui/core"
import {Link} from "react-router-dom"
import {None} from "monet"
import {List} from "immutable"
import {searchVideos} from "services/video/VideoService"
import InfiniteScroll from "react-infinite-scroller"
import VideoCard from "components/video/video-card/VideoCard"
import Video from "models/Video"
import {SortBy} from "models/SortBy";

const PAGE_SIZE = 50

export default () => {
  const [videos, setVideos] = useState<List<Video>>(List<Video>())
  const [hasMore, setHasMore] = useState<boolean>(true)

  const fetchVideos = (pageNumber: number): Promise<void> =>
    searchVideos(None(), pageNumber - 1, PAGE_SIZE, SortBy.Date).then(({ results }) => {
      if (results.length < PAGE_SIZE) {
        setHasMore(false)
      }

      setVideos((videos) => videos.concat(results))
    })

  return (
    <InfiniteScroll pageStart={0} loadMore={fetchVideos} hasMore={hasMore} threshold={500}>
      <GridList cols={4} cellHeight="auto">
        {videos.map((video, index) => (
          <GridListTile cols={1} key={index}>
            <Link to={`/video/${video.videoMetadata.id}`} key={index}>
              <VideoCard {...video} />
            </Link>
          </GridListTile>
        ))}
      </GridList>
    </InfiniteScroll>
  )
}
