import React, { type FC, useEffect, useRef, useState } from "react"
import { IconButton, Tooltip } from "@mui/material"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import CheckIcon from "@mui/icons-material/Check"

import styles from "../ServiceInformation.module.scss"

type CopyableTextProps = {
  readonly text: string
}

const CopyableText: FC<CopyableTextProps> = ({ text }) => {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy to clipboard", error)
    }
  }

  return (
    <span className={styles.copyableText}>
      <span>{text}</span>
      <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
        <IconButton
          size="small"
          onClick={handleCopy}
          className={styles.copyButton}
          aria-label="Copy to clipboard"
        >
          {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
    </span>
  )
}

export default CopyableText
