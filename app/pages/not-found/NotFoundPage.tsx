import React from "react"
import { Link } from "react-router"
import { Button, Typography } from "@mui/material"
import Helmet from "~/components/helmet/Helmet"

import styles from "./NotFoundPage.module.scss"

const NotFoundPage = () => (
  <main className={styles.notFoundPage}>
    <Helmet title="Page Not Found" />
    <Typography variant="h1" className={styles.statusCode}>
      404
    </Typography>
    <Typography variant="h5" component="h2" className={styles.title}>
      Page not found
    </Typography>
    <Typography className={styles.description}>
      The page you are looking for does not exist or may have been moved.
    </Typography>
    <Button variant="contained" color="primary" component={Link} to="/">
      Back to Home
    </Button>
  </main>
)

export default NotFoundPage
