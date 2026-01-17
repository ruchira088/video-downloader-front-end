import React, { type FC, useState } from "react"
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField
} from "@mui/material"
import { Playlist } from "~/models/Playlist"
import { createPlaylist } from "~/services/playlist/PlaylistService"

type CreatePlaylistDialogProps = {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly onPlaylistCreated: (playlist: Playlist) => void
}

const CreatePlaylistDialog: FC<CreatePlaylistDialogProps> = ({
  isOpen,
  onClose,
  onPlaylistCreated
}) => {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return

    setIsSubmitting(true)

    try {
      const playlist = await createPlaylist(
        name.trim(),
        description.trim() || undefined
      )
      onPlaylistCreated(playlist)
      setName("")
      setDescription("")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setName("")
      setDescription("")
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Playlist</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Name"
          fullWidth
          variant="outlined"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={isSubmitting}
        />
        <TextField
          margin="dense"
          label="Description (optional)"
          fullWidth
          variant="outlined"
          multiline
          rows={3}
          value={description}
          onChange={e => setDescription(e.target.value)}
          disabled={isSubmitting}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={!name.trim() || isSubmitting}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreatePlaylistDialog
