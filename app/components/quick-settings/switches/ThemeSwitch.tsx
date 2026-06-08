import { useApplicationConfiguration } from "~/providers/ApplicationConfigurationProvider"
import { LightMode, DarkMode } from "@mui/icons-material"
import { Theme } from "~/models/ApplicationConfiguration"
import QuickSettingsButton from "./QuickSettingsButton"

const ThemeSwitch = () => {
  const { theme, setTheme } = useApplicationConfiguration()
  const isDark = theme === Theme.Dark

  return (
    <QuickSettingsButton
      tooltip={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      ariaLabel={isDark ? "Switch to light mode" : "Switch to dark mode"}
      icon={isDark ? <LightMode /> : <DarkMode />}
      onClick={() => setTheme(isDark ? Theme.Light : Theme.Dark)}
    />
  )
}

export default ThemeSwitch
