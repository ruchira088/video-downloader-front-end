import React, { type FC, useState } from "react"
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material"
import { Playlist } from "~/models/Playlist"

type DeletePlaylistDialogProps = {
  readonly isOpen: boolean
  readonly playlist: Playlist
  readonly onClose: () => void
  /** Rejections are the caller's to report; the dialog only closes itself once the call settles. */
  readonly onDelete: () => Promise<unknown>
}

const DeletePlaylistDialog: FC<DeletePlaylistDialogProps> = ({ isOpen, playlist, onClose, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false)

  const videoCount = playlist.videos.length

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete()
    } catch {
      // Reported by the caller via onDelete's rejection handling
    } finally {
      setIsDeleting(false)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onClose={isDeleting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Delete Playlist?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          <strong>{playlist.title}</strong>
        </DialogContentText>
        <DialogContentText>
          This playlist and its {videoCount} {videoCount === 1 ? "video" : "videos"} will be removed from your
          playlists. The videos themselves are not deleted.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isDeleting}>
          Cancel
        </Button>
        <Button color="secondary" variant="contained" onClick={handleDelete} disabled={isDeleting}>
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DeletePlaylistDialog
