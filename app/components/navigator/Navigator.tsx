import React from "react"
import { Link, type UIMatch, useMatches } from "react-router"
import styles from "./Navigator.module.scss"
import classNames from "classnames"

type NavigationTab = {
  readonly label: string
  readonly path: string
}

const navigationTabs: NavigationTab[] = [
  { label: "Videos", path: "/" },
  { label: "History", path: "/history" },
  { label: "Playlists", path: "/playlists" },
  { label: "Schedule", path: "/schedule" },
  { label: "Downloading", path: "/downloading" },
  { label: "Duplicates", path: "/duplicates" },
  { label: "Information", path: "/information" }
]

const activeTabPath = (matches: UIMatch[]): string => {
  const currentPath = matches[matches.length - 1]?.pathname ?? "/"

  // Find the tab with the longest matching path prefix (excluding root)
  const matchingTab = navigationTabs
    .filter(tab => tab.path !== "/" && currentPath.startsWith(tab.path))
    .sort((a, b) => b.path.length - a.path.length)[0]

  // If no specific tab matches, default to Videos (root tab)
  return (matchingTab ?? navigationTabs[0]).path
}

const Navigator = () => {
  const matches = useMatches()
  const activePath = activeTabPath(matches)

  return (
    <div className={styles.navigator}>
      <div className={styles.navigatorTabs}>
      {
        navigationTabs.map((navigationTab) => (
            <Link
              to={navigationTab.path}
              prefetch="intent"
              className={
                classNames(
                  styles.navigatorTab,
                  { [styles.isActive]: activePath === navigationTab.path }
                )
              }
              key={navigationTab.path}>
              {navigationTab.label}
            </Link>
          )
        )
      }
        </div>
    </div>
  )
}

export default Navigator
