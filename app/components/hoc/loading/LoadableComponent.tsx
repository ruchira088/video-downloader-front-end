import React, {type FC, type ReactNode} from "react"
import {Option} from "~/types/Option"

import styles from "./LoadableComponent.module.scss"
import {CircularProgress} from "@mui/material"
import classNames from "classnames"

type LoadableComponentProps = {
  readonly children: Option<ReactNode>
  readonly className?: string
}

export const LoadableComponent: FC<LoadableComponentProps> = props =>
  <div className={classNames(styles.loadableComponent, props.className)}>
    {
      props.children.fold<ReactNode>(
        () => <CircularProgress size="5em"/>,
        reactNode => reactNode
      )
    }
  </div>