import { IconButton, Tooltip } from "@mui/material"
import LogoutIcon from "@mui/icons-material/Logout"
import { logout } from "~/services/authentication/AuthenticationService"
import { useNavigate } from "react-router"

const LogoutButton = () => {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate("/sign-in")
  }

  return (
    <Tooltip title="Logout">
      <IconButton onClick={handleLogout} size="small" aria-label="Logout">
        <LogoutIcon />
      </IconButton>
    </Tooltip>
  )
}

export default LogoutButton
