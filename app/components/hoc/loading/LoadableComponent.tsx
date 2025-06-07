import React, {type FC, type ReactNode} from "react"
import {Option} from "~/types/Option"
import {CircularProgress} from "@mui/material"

type LoadableComponentProps = {
  readonly children: Option<ReactNode>
  readonly className?: string
}

export const LoadableComponent: FC<LoadableComponentProps> = props =>
  <div className={props.className}>
    {
      props.children.fold<ReactNode>(
        () => <CircularProgress size="5em"/>,
        reactNode => reactNode
      )
    }
  </div>