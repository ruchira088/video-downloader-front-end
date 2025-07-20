import { useApplicationConfiguration } from "~/providers/ApplicationConfigurationProvider"
import { FormControlLabel, Switch } from "@mui/material"
import { Theme } from "~/models/ApplicationConfiguration"

const ThemeSwitch = () => {
  const { theme, setTheme } = useApplicationConfiguration()

  return (
    <FormControlLabel
      control={
        <Switch
          checked={theme === Theme.Dark}
          onChange={({ target }) => setTheme(target.checked ? Theme.Dark : Theme.Light)}
        />
      }
      label="Dark Mode"
    />
  )
}

export default ThemeSwitch