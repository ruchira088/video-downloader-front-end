import React, { type ReactElement, useState } from "react"
import { Link, type UIMatch, useMatches } from "react-router"
import { ButtonBase, Menu, MenuItem, useMediaQuery } from "@mui/material"
import VideoLibrary from "@mui/icons-material/VideoLibrary"
import History from "@mui/icons-material/History"
import PlaylistPlay from "@mui/icons-material/PlaylistPlay"
import Schedule from "@mui/icons-material/Schedule"
import Download from "@mui/icons-material/Download"
import ContentCopy from "@mui/icons-material/ContentCopy"
import Info from "@mui/icons-material/Info"
import MoreHoriz from "@mui/icons-material/MoreHoriz"
import AdminPanelSettings from "@mui/icons-material/AdminPanelSettings"
import { useIsAdmin } from "~/providers/AuthenticatedUserProvider"
import { None, Option, Some } from "~/types/Option"
import styles from "./Navigator.module.scss"
import classNames from "classnames"

type NavigationTab = {
  readonly label: string
  readonly path: string
  readonly icon: ReactElement
  // Shown only to admins: the server rejects these pages' requests for anyone else.
  readonly adminOnly?: boolean
}

const navigationTabs: NavigationTab[] = [
  { label: "Videos", path: "/", icon: <VideoLibrary /> },
  { label: "History", path: "/history", icon: <History /> },
  { label: "Playlists", path: "/playlists", icon: <PlaylistPlay /> },
  { label: "Schedule", path: "/schedule", icon: <Schedule /> },
  { label: "Downloading", path: "/downloading", icon: <Download /> },
  { label: "Duplicates", path: "/duplicates", icon: <ContentCopy />, adminOnly: true },
  { label: "Information", path: "/information", icon: <Info /> },
  { label: "Admin", path: "/admin", icon: <AdminPanelSettings />, adminOnly: true }
]

// The bottom bar has room for four tabs plus "More"; the rest live in the overflow menu.
const bottomBarPaths = ["/", "/history", "/playlists", "/downloading"]
const bottomBarTabs = navigationTabs.filter(tab => bottomBarPaths.includes(tab.path))

/** Matches the breakpoint in Navigator.module.scss and Header.module.scss. */
export const MOBILE_MEDIA_QUERY = "(width <= 48em)"

const activeTabPath = (matches: UIMatch[]): string => {
  const currentPath = matches[matches.length - 1]?.pathname ?? "/"

  // Find the tab with the longest matching path prefix (excluding root)
  const matchingTab = navigationTabs
    .filter(tab => tab.path !== "/" && currentPath.startsWith(tab.path))
    .sort((a, b) => b.path.length - a.path.length)[0]

  // If no specific tab matches, default to Videos (root tab)
  return (matchingTab ?? navigationTabs[0]).path
}

type TabsProps = {
  readonly activePath: string
  readonly tabs: NavigationTab[]
}

const DesktopTabs = ({ activePath, tabs }: TabsProps) => (
  <nav className={styles.navigator} aria-label="Primary">
    <div className={styles.navigatorTabs}>
      {tabs.map(navigationTab => (
        <Link
          to={navigationTab.path}
          prefetch="intent"
          className={classNames(styles.navigatorTab, { [styles.isActive]: activePath === navigationTab.path })}
          key={navigationTab.path}
        >
          {navigationTab.icon}
          <span>{navigationTab.label}</span>
        </Link>
      ))}
    </div>
  </nav>
)

const BottomBar = ({ activePath, tabs }: TabsProps) => {
  const overflowTabs = tabs.filter(tab => !bottomBarPaths.includes(tab.path))
  const [menuAnchor, setMenuAnchor] = useState<Option<HTMLElement>>(None.of())
  const closeMenu = () => setMenuAnchor(None.of())

  const isOverflowActive = overflowTabs.some(tab => tab.path === activePath)

  return (
    <nav className={styles.bottomBar} aria-label="Primary">
      {bottomBarTabs.map(navigationTab => (
        <Link
          to={navigationTab.path}
          prefetch="intent"
          className={classNames(styles.bottomBarTab, { [styles.isActive]: activePath === navigationTab.path })}
          key={navigationTab.path}
        >
          {navigationTab.icon}
          <span>{navigationTab.label}</span>
        </Link>
      ))}
      <ButtonBase
        className={classNames(styles.bottomBarTab, { [styles.isActive]: isOverflowActive })}
        onClick={event => setMenuAnchor(Some.of(event.currentTarget))}
        aria-haspopup="menu"
        aria-expanded={!menuAnchor.isEmpty()}
      >
        <MoreHoriz />
        <span>More</span>
      </ButtonBase>
      <Menu
        anchorEl={menuAnchor.toNullable()}
        open={!menuAnchor.isEmpty()}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {overflowTabs.map(navigationTab => (
          <MenuItem
            component={Link}
            to={navigationTab.path}
            onClick={closeMenu}
            selected={activePath === navigationTab.path}
            className={styles.overflowMenuItem}
            key={navigationTab.path}
          >
            {navigationTab.icon}
            {navigationTab.label}
          </MenuItem>
        ))}
      </Menu>
    </nav>
  )
}

const Navigator = () => {
  const matches = useMatches()
  const activePath = activeTabPath(matches)
  // The app is a client-only SPA, so there is no server render to keep in sync with.
  const isMobile = useMediaQuery(MOBILE_MEDIA_QUERY, { noSsr: true })
  const isAdmin = useIsAdmin()
  const tabs = navigationTabs.filter(tab => isAdmin || !tab.adminOnly)

  return isMobile ? <BottomBar activePath={activePath} tabs={tabs} /> : <DesktopTabs activePath={activePath} tabs={tabs} />
}

export default Navigator
