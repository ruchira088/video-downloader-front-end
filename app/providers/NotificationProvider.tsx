import React, { type FC, useCallback, useMemo, useRef, useState } from "react"
import { Alert, Snackbar, type SnackbarCloseReason } from "@mui/material"
import { None, type Option, Some } from "~/types/Option"
import { reportError } from "~/services/ErrorReporting"

const AUTO_HIDE_DURATION_MS = 6000

export type NotificationSeverity = "success" | "error"

export type Notification = {
  // Distinguishes successive notifications, so each one restarts the auto-hide timer.
  readonly id: number
  readonly message: string
  readonly severity: NotificationSeverity
}

export type NotificationContext = {
  readonly notifySuccess: (message: string) => void

  /**
   * Surfaces a failure to the user. `error` is only logged — the message shown is the
   * caller-supplied one, so users get "Failed to rename playlist" rather than raw API text.
   */
  readonly notifyError: (message: string, error?: unknown) => void
}

/**
 * The default is a working, headless implementation rather than `None`: notifications are
 * non-essential feedback, so a component rendered outside the provider (a test harness, a
 * stray subtree) still logs instead of throwing.
 */
const consoleNotificationContext: NotificationContext = {
  notifySuccess: (message) => console.debug(message),
  notifyError: (message, error) => reportError(message, error),
}

export const NotificationReactContext = React.createContext<NotificationContext>(consoleNotificationContext)

export type NotificationProviderProps = {
  readonly children?: React.ReactNode
}

export const NotificationProvider: FC<NotificationProviderProps> = props => {
  const [notification, setNotification] = useState<Option<Notification>>(None.of())
  const nextNotificationId = useRef(0)

  const notify = useCallback((message: string, severity: NotificationSeverity) => {
    nextNotificationId.current += 1
    setNotification(Some.of({ id: nextNotificationId.current, message, severity }))
  }, [])

  const notifySuccess = useCallback((message: string) => notify(message, "success"), [notify])

  const notifyError = useCallback((message: string, error?: unknown) => {
    // The snackbar is deliberately free of stack traces, so the error itself is reported.
    reportError(message, error)
    notify(message, "error")
  }, [notify])

  const notificationContext = useMemo<NotificationContext>(
    () => ({ notifySuccess, notifyError }),
    [notifySuccess, notifyError]
  )

  const dismiss = useCallback(() => setNotification(None.of()), [])

  // MUI counts any click on the page as a "clickaway" dismissal, which would wipe a message
  // the moment the user carries on working. Only an explicit close or the timeout dismisses.
  const onSnackbarClose = useCallback(
    (_event: unknown, reason: SnackbarCloseReason) => {
      if (reason !== "clickaway") {
        dismiss()
      }
    },
    [dismiss]
  )

  return (
    <NotificationReactContext.Provider value={notificationContext}>
      {props.children}
      {
        notification
          .map(({ id, message, severity }) => (
            // Keyed so a replacement remounts: MUI only restarts the auto-hide timer when `open` changes.
            <Snackbar
              key={id}
              open
              autoHideDuration={AUTO_HIDE_DURATION_MS}
              onClose={onSnackbarClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
              <Alert onClose={dismiss} severity={severity} variant="filled">
                {message}
              </Alert>
            </Snackbar>
          ))
          .toDefined()
      }
    </NotificationReactContext.Provider>
  )
}

export const useNotification = (): NotificationContext => React.useContext(NotificationReactContext)
