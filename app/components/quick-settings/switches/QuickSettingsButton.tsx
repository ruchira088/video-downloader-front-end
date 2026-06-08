import React, { type FC, type ReactNode } from "react"
import { IconButton, Tooltip } from "@mui/material"
import styles from "./QuickSettingsButton.module.scss"

type QuickSettingsButtonProps = {
  readonly tooltip: string
  readonly ariaLabel: string
  readonly icon: ReactNode
  readonly onClick: () => void
  readonly disabled?: boolean
}

const QuickSettingsButton: FC<QuickSettingsButtonProps> = props => {
  const button = (
    <IconButton
      onClick={props.onClick}
      size="small"
      disabled={props.disabled}
      aria-label={props.ariaLabel}
      className={styles.quickSettingsButton}
    >
      {props.icon}
    </IconButton>
  )

  return (
    <Tooltip title={props.tooltip}>
      {/* A disabled button doesn't fire the tooltip's hover events, so wrap it in a span anchor. */}
      {props.disabled !== undefined ? <span>{button}</span> : button}
    </Tooltip>
  )
}

export default QuickSettingsButton
