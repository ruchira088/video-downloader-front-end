import React from "react"
import { Maybe } from "monet"

import styles from "./VideoSiteCard.module.css"

import pornhub from "images/logos/porn-hub.png"
import pornone from "images/logos/porn-one.png"
import spankbang from "images/logos/spankbang.png"
import eporner from "images/logos/eporner.png"
import xfreehd from "images/logos/xfreehd.png"
import xhamster from "images/logos/xhamster.png"
import xnxx from "images/logos/xnxx.png"
import youporn from "images/logos/youporn.png"
import xvideos from "images/logos/xvideos.png"
import youtube from "images/logos/youtube.png"

const VideoSiteCard = (props: { videoSite: string }) =>
  Maybe.fromNull(videoSiteLogos[props.videoSite]).fold(<span/>)((logo) =>
    <img className={styles.videoSiteLogo} src={logo} alt="site logo" />
  )
  
const videoSiteLogos: { [key: string]: string } = {
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