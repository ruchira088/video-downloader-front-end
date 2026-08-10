import React, { type FC, useCallback, useMemo, useState } from "react"
import { Alert, Snackbar, type SnackbarCloseReason } from "@mui/material"
import { None, type Option, Some } from "~/types/Option"

const AUTO_HIDE_DURATION_MS = 6000

export type NotificationSeverity = "success" | "error"

export type Notification = {
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
  notifyError: (message, error) => console.error(message, error),
}

export const NotificationReactContext = React.createContext<NotificationContext>(consoleNotificationContext)

export type NotificationProviderProps = {
  readonly children?: React.ReactNode
}

export const NotificationProvider: FC<NotificationProviderProps> = props => {
  const [notification, setNotification] = useState<Option<Notification>>(None.of())

  const notifySuccess = useCallback((message: string) => {
    setNotification(Some.of({ message, severity: "success" }))
  }, [])

  const notifyError = useCallback((message: string, error?: unknown) => {
    // Keep the console breadcrumb: the snackbar is deliberately free of stack traces.
    console.error(message, error)
    setNotification(Some.of({ message, severity: "error" }))
  }, [])

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
          .map(({ message, severity }) => (
            <Snackbar
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
