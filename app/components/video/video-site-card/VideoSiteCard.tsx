import React, {type FC} from "react"

import styles from "./VideoSiteCard.module.css"

import pornhub from "~/images/site-logos/porn-hub.png"
import pornone from "~/images/site-logos/porn-one.png"
import spankbang from "~/images/site-logos/spankbang.png"
import eporner from "~/images/site-logos/eporner.png"
import xfreehd from "~/images/site-logos/xfreehd.png"
import xhamster from "~/images/site-logos/xhamster.png"
import xnxx from "~/images/site-logos/xnxx.png"
import youporn from "~/images/site-logos/youporn.png"
import xvideos from "~/images/site-logos/xvideos.png"
import youtube from "~/images/site-logos/youtube.png"
import {Option} from "~/types/Option"

type VideoSiteCardProps = {
  readonly videoSite: string
}

const VideoSiteCard: FC<VideoSiteCardProps> = props =>
  Option.fromNullable(videoSiteLogos[props.videoSite])
    .fold(
      () => <span className={styles.siteName}>{props.videoSite}</span>,
      logo => <img className={styles.videoSiteLogo} src={logo} alt={`${props.videoSite} logo`} />
  )
  
const videoSiteLogos: Record<string, string> = {
  pornhub,
  spankbang,
  pornone,
  eporner,
  xfreehd,
  xhamster,
  youtube,
  xnxx,
  youporn,
  xvideos
}

export default VideoSiteCard