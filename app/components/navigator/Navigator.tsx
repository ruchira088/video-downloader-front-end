import React from "react"
import { Link, type UIMatch, useMatches } from "react-router"
import styles from "./Navigator.module.scss"
import classNames from "classnames"
import { None, type Option, Some } from "~/types/Option"

type NavigationTab = {
  readonly label: string
  readonly path: string
}

const navigationTabs: NavigationTab[] = [
  { label: "Videos", path: "/" },
  { label: "Schedule", path: "/schedule" },
  { label: "Playlists", path: "/playlists" },
  { label: "History", path: "/history" },
  { label: "Downloading", path: "/downloading" },
  { label: "Information", path: "/information" }
]

const getActiveTab = (matches: UIMatch[]): Option<NavigationTab> => {
  const currentPath = matches[matches.length - 1]?.pathname ?? "/"

  // Find the tab with the longest matching path prefix (excluding root)
  const matchingTab = navigationTabs
    .filter(tab => tab.path !== "/" && currentPath.startsWith(tab.path))
    .sort((a, b) => b.path.length - a.path.length)[0]

  // If no specific tab matches, default to Videos (root tab)
  return Some.of(matchingTab ?? navigationTabs[0])
}

const Navigator = () => {
  const matches = useMatches()
  const activeTab: Option<string> = getActiveTab(matches).map(tab => tab.path)

  return (
    <div className={styles.navigator}>
      <div className={styles.navigatorTabs}>
      {
        navigationTabs.map((navigationTab, index) => (
            <Link
              to={navigationTab.path}
              className={
                classNames(
                  styles.navigatorTab,
                  { [styles.isActive]: activeTab.toDefined() === navigationTab.path }
                )
              }
              key={index}>
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
