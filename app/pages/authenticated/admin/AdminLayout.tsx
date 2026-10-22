import React from "react"
import { Outlet } from "react-router"
import Helmet from "~/components/helmet/Helmet"
import { useIsAdmin } from "~/providers/AuthenticatedUserProvider"
import styles from "./Admin.module.scss"

/**
 * Gates admin-only pages. The server rejects their requests for other users anyway, so this
 * only spares non-admins (e.g. following a shared link) a page of 403 errors.
 */
const AdminLayout = () =>
  useIsAdmin() ? (
    <Outlet />
  ) : (
    <div className={styles.adminOnly}>
      <Helmet title="Admins only" />
      This page is only available to administrators.
    </div>
  )

export default AdminLayout
