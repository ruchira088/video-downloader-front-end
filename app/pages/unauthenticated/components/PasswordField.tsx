import React, { type ChangeEvent, type FC, useState } from "react"
import { IconButton, InputAdornment, TextField } from "@mui/material"
import Visibility from "@mui/icons-material/Visibility"
import VisibilityOff from "@mui/icons-material/VisibilityOff"

type PasswordFieldProps = {
  readonly label: string
  readonly name: string
  readonly autoComplete: string
  readonly value: string
  readonly onChange: (event: ChangeEvent<HTMLInputElement>) => void
  readonly error: boolean
  readonly helperText: string | null
  readonly className?: string
}

/** A full-width password input with a show/hide toggle in its end adornment. */
const PasswordField: FC<PasswordFieldProps> = props => {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <TextField
      error={props.error}
      value={props.value}
      onChange={props.onChange}
      helperText={props.helperText}
      label={props.label}
      type={showPassword ? "text" : "password"}
      name={props.name}
      autoComplete={props.autoComplete}
      className={props.className}
      fullWidth
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          )
        }
      }}
    />
  )
}

export default PasswordField
