import React, { type FC, type ReactElement } from "react"
import { Chip } from "@mui/material"
import Computer from "@mui/icons-material/Computer"

import eporner from "~/images/site-favicons/eporner.png"
import hclips from "~/images/site-favicons/hclips.png"
import hdzog from "~/images/site-favicons/hdzog.png"
import hotmovs from "~/images/site-favicons/hotmovs.png"
import pornhub from "~/images/site-favicons/pornhub.png"
import pornone from "~/images/site-favicons/pornone.png"
import spankbang from "~/images/site-favicons/spankbang.png"
import sxyprn from "~/images/site-favicons/sxyprn.png"
import txxx from "~/images/site-favicons/txxx.png"
import upornia from "~/images/site-favicons/upornia.png"
import xfreehd from "~/images/site-favicons/xfreehd.png"
import xhamster from "~/images/site-favicons/xhamster.png"
import xnxx from "~/images/site-favicons/xnxx.jpg"
import xvideos from "~/images/site-favicons/xvideos.png"
import youporn from "~/images/site-favicons/youporn.png"
import youtube from "~/images/site-favicons/youtube.png"
import { Option } from "~/types/Option"
import styles from "./VideoSiteChip.module.scss"

// Bundled rather than fetched from a favicon service, so the browser never tells a third party which sites are in
// the library. Keyed by the site name the API reports: the yt-dlp extractor name, or the custom site's name.
const siteFavicons: Record<string, string> = {
  eporner,
  hclips,
  hdzog,
  hotmovs,
  pornhub,
  pornone,
  spankbang,
  sxyprn,
  txxx,
  upornia,
  xfreehd,
  xhamster,
  xhamster2: xhamster,
  xnxx,
  xvideos,
  youporn,
  youtube
}

type VideoSiteChipProps = {
  readonly videoSite: string
}

// The chip's label already names the site, so the icon is decorative (empty alt).
// A site we have no favicon for still gets its name, just without an icon.
const siteIcon = (videoSite: string): ReactElement | undefined =>
  videoSite === "local"
    ? <Computer />
    : Option.fromNullable(siteFavicons[videoSite])
      .fold<ReactElement | undefined>(() => undefined, favicon => <img className={styles.favicon} src={favicon} alt="" />)

const VideoSiteChip: FC<VideoSiteChipProps> = ({ videoSite }) =>
  <Chip icon={siteIcon(videoSite.toLowerCase())} label={videoSite} size="small" />

export default VideoSiteChip
