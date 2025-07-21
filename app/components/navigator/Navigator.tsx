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
  { label: "History", path: "/history" },
  { label: "Downloading", path: "/downloading" },
  { label: "Service Information", path: "/service-information" }
]

const getActiveTab = (matches: UIMatch[]): Option<NavigationTab> =>
  navigationTabs.reduce<Option<[number, NavigationTab]>>((acc, tab) =>
      matches.reduce<Option<number>>(
        (acc, match, index) => tab.path === match.pathname ? Some.of(index) : acc,
        None.of()
      ).flatMap(value => acc.filter(([num, _]) => num > value).orElse(() => Some.of([value, tab])))
        .orElse(() => acc)
    ,
    None.of()
  )
    .map(([_, tab]) => tab)

const Navigator = () => {
  const matches = useMatches()
  const activeTab: Option<string> = getActiveTab(matches).map(tab => tab.path)

  return (
    <div className={styles.navigator}>
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
  )
}

export default Navigator
