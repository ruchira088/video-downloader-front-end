import React, { type FC, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableRow, TableSortLabel } from "@mui/material"
import VideoSiteChip from "~/components/video/video-site-chip/VideoSiteChip"
import type { VideoSiteSummary } from "~/models/VideoServiceSummary"
import { compactDuration, humanReadableSize } from "~/utils/Formatter"
import type { Duration } from "luxon"
import styles from "./Admin.module.scss"

type Column = {
  readonly key: keyof VideoSiteSummary
  readonly label: string
  readonly render: (summary: VideoSiteSummary) => string | React.ReactElement
  readonly compare: (a: VideoSiteSummary, b: VideoSiteSummary) => number
}

type Sort = {
  readonly column: Column
  readonly direction: "asc" | "desc"
}

const byDuration = (select: (summary: VideoSiteSummary) => Duration) =>
  (a: VideoSiteSummary, b: VideoSiteSummary) => select(a).toMillis() - select(b).toMillis()

const siteColumn: Column = {
  key: "site",
  label: "Site",
  render: ({ site }) => <VideoSiteChip videoSite={site} />,
  compare: (a, b) => a.site.localeCompare(b.site)
}

const videoCountColumn: Column = {
  key: "videoCount",
  label: "Videos",
  render: ({ videoCount }) => videoCount.toLocaleString(),
  compare: (a, b) => a.videoCount - b.videoCount
}

const columns: readonly Column[] = [
  siteColumn,
  videoCountColumn,
  {
    key: "totalSize",
    label: "Size",
    render: ({ totalSize }) => humanReadableSize(totalSize),
    compare: (a, b) => a.totalSize - b.totalSize
  },
  {
    key: "totalDuration",
    label: "Duration",
    render: ({ totalDuration }) => compactDuration(totalDuration),
    compare: byDuration(summary => summary.totalDuration)
  },
  {
    key: "watchTime",
    label: "Watch time",
    render: ({ watchTime }) => compactDuration(watchTime),
    compare: byDuration(summary => summary.watchTime)
  }
]

type SiteBreakdownTableProps = {
  readonly siteBreakdown: readonly VideoSiteSummary[]
}

const SiteBreakdownTable: FC<SiteBreakdownTableProps> = ({ siteBreakdown }) => {
  const [sort, setSort] = useState<Sort>({ column: videoCountColumn, direction: "desc" })

  const onSort = (column: Column) =>
    setSort(current =>
      current.column === column
        ? { column, direction: current.direction === "asc" ? "desc" : "asc" }
        // Names read naturally A to Z; numbers are most useful largest first.
        : { column, direction: column === siteColumn ? "asc" : "desc" }
    )

  const { compare } = sort.column
  const sorted = [...siteBreakdown].sort((a, b) => sort.direction === "asc" ? compare(a, b) : compare(b, a))

  return (
    <Table size="small" className={styles.siteBreakdown} aria-label="Library by site">
      <TableHead>
        <TableRow>
          {columns.map(column => (
            <TableCell
              key={column.key}
              align={column === siteColumn ? "left" : "right"}
              sortDirection={sort.column === column ? sort.direction : false}
            >
              <TableSortLabel
                active={sort.column === column}
                direction={sort.column === column ? sort.direction : "desc"}
                onClick={() => onSort(column)}
              >
                {column.label}
              </TableSortLabel>
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {sorted.map(summary => (
          <TableRow key={summary.site}>
            {columns.map(column => (
              <TableCell key={column.key} align={column === siteColumn ? "left" : "right"} data-label={column.label}>
                {column.render(summary)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default SiteBreakdownTable
