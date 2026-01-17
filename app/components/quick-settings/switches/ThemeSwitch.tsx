import { useApplicationConfiguration } from "~/providers/ApplicationConfigurationProvider"
import { IconButton, Tooltip } from "@mui/material"
import { LightMode, DarkMode } from "@mui/icons-material"
import { Theme } from "~/models/ApplicationConfiguration"

const ThemeSwitch = () => {
  const { theme, setTheme } = useApplicationConfiguration()
  const isDark = theme === Theme.Dark

  return (
    <Tooltip title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}>
      <IconButton
        onClick={() => setTheme(isDark ? Theme.Light : Theme.Dark)}
        size="small"
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? <LightMode /> : <DarkMode />}
      </IconButton>
    </Tooltip>
  )
}

export default ThemeSwitch