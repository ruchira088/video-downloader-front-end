import LogoutIcon from "@mui/icons-material/Logout"
import { logout } from "~/services/authentication/AuthenticationService"
import { useNavigate } from "react-router"
import QuickSettingsButton from "./QuickSettingsButton"

const LogoutButton = () => {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate("/sign-in")
  }

  return (
    <QuickSettingsButton tooltip="Logout" ariaLabel="Logout" icon={<LogoutIcon />} onClick={handleLogout} />
  )
}

export default LogoutButton
