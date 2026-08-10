import React, { type FC, useCallback, useEffect, useMemo, useState } from "react"
import { None, Option, Some } from "~/types/Option"
import { localStorageConfigurationService } from "~/services/config/ConfigurationService"
import { type ApplicationConfiguration, Theme } from "~/models/ApplicationConfiguration"
import { createTheme, ThemeProvider } from "@mui/material"

export type ApplicationConfigurationContextProps = {
  readonly children?: React.ReactNode;
}

export type ApplicationConfigurationContext = {
  readonly safeMode: boolean;
  readonly theme: Theme;
  readonly setSafeMode: (safeMode: boolean) => void;
  readonly setTheme: (theme: Theme) => void;
}

export const ApplicationConfigurationContext =
  React.createContext<Option<ApplicationConfigurationContext>>(None.of())

export const ApplicationConfigurationProvider: FC<ApplicationConfigurationContextProps> = props => {
  const [applicationConfiguration, setApplicationConfiguration] = useState<Option<ApplicationConfiguration>>(None.of())

  const setSafeMode = useCallback((safeMode: boolean) => setApplicationConfiguration((prev) => prev.map(config => ({
    ...config,
    safeMode
  }))), [])

  const setTheme = useCallback(
    (theme: Theme) => setApplicationConfiguration((prev) => prev.map(config => ({ ...config, theme }))),
    []
  )

  // Rebuilding the MUI theme, and the context value, on every render would re-render every
  // consumer of either for changes that have nothing to do with configuration.
  const theme = useMemo(
    () => createTheme({
      colorSchemes: applicationConfiguration.map(({theme}) => ({dark: theme === Theme.Dark})).toDefined()
    }),
    [applicationConfiguration]
  )

  const configurationContext = useMemo(
    () => applicationConfiguration.map(config => ({ ...config, setSafeMode, setTheme })),
    [applicationConfiguration, setSafeMode, setTheme]
  )

  useEffect(() => {
    void localStorageConfigurationService.getApplicationConfiguration()
      .then(applicationConfiguration =>
        applicationConfiguration.fold<Promise<ApplicationConfiguration>>(
          () => localStorageConfigurationService.getDefaultApplicationConfiguration(),
          appConfig => Promise.resolve(appConfig)
        )
      )
      .catch(() => localStorageConfigurationService.getDefaultApplicationConfiguration())
      .then(appConfig => setApplicationConfiguration(Some.of(appConfig)))
  }, [])

  useEffect(() => {
    void applicationConfiguration.forEach(appConfig => {
      document.body.setAttribute("data-theme", appConfig.theme)
      void localStorageConfigurationService.setApplicationConfiguration(appConfig)
    })
  }, [applicationConfiguration])

  if (applicationConfiguration.isEmpty()) {
    return null
  } else {
    return (
      <ApplicationConfigurationContext.Provider value={configurationContext}>
        <ThemeProvider theme={theme}>
          {props.children}
        </ThemeProvider>
      </ApplicationConfigurationContext.Provider>
    )
  }
}

export const useApplicationConfiguration = (): ApplicationConfigurationContext => {
  const applicationConfigurationContext = React.useContext(ApplicationConfigurationContext)

  return applicationConfigurationContext.getOrElse(() => {
      throw new Error("ApplicationConfigurationContext is not initialized")
    }
  )
}