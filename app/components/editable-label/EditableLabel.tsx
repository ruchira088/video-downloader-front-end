import { useState } from "react"
import styles from "./EditableLabel.module.scss"
import { IconButton, TextField, Tooltip } from "@mui/material"
import EditIcon from "@mui/icons-material/Edit"
import CheckIcon from "@mui/icons-material/Check"
import CloseIcon from "@mui/icons-material/Close"
import { useNotification } from "~/providers/NotificationProvider"

const ReadModeLabel = ({ textValue, enabledEditMode }: { textValue: string; enabledEditMode: () => void }) => (
  <span className={styles.readModeLabel}>
    {textValue}
    <Tooltip title="Edit title">
      <IconButton className={styles.editButton} size="small" aria-label="Edit" onClick={enabledEditMode}>
        <EditIcon fontSize="inherit" />
      </IconButton>
    </Tooltip>
  </span>
)

const EditableTextField = ({
  textValue,
  onTextChange,
  onCancel,
  onSaveClick,
}: {
  textValue: string
  onTextChange: (text: string) => void
  onCancel: () => void
  onSaveClick: (text: string) => void
}) => (
  <span className={styles.editMode}>
    <TextField
      className={styles.textField}
      value={textValue}
      autoFocus
      size="small"
      slotProps={{ htmlInput: { "aria-label": "Title" } }}
      onChange={(event) => onTextChange(event.target.value)}
      // Enter and Escape are what people reach for in a single-field inline editor.
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault()
          onSaveClick(textValue)
        } else if (event.key === "Escape") {
          event.preventDefault()
          onCancel()
        }
      }}
    />
    <Tooltip title="Save">
      <IconButton className={styles.actionButton} size="small" color="primary" aria-label="Save" onClick={() => onSaveClick(textValue)}>
        <CheckIcon fontSize="inherit" />
      </IconButton>
    </Tooltip>
    <Tooltip title="Cancel">
      <IconButton className={styles.actionButton} size="small" aria-label="Cancel" onClick={onCancel}>
        <CloseIcon fontSize="inherit" />
      </IconButton>
    </Tooltip>
  </span>
)

const EditableLabel = ({ textValue, onUpdateText }: { textValue: string; onUpdateText: (text: string) => Promise<void> }) => {
  const [draftText, setDraftText] = useState<string>("")
  const [editMode, setEditMode] = useState(false)
  const { notifyError } = useNotification()

  const enableEditMode = () => {
    setDraftText(textValue)
    setEditMode(true)
  }

  const onCancel = () => setEditMode(false)

  const onSaveClick = (updatedText: string) =>
    onUpdateText(updatedText)
      .then(() => setEditMode(false))
      .catch((error) => notifyError("Failed to save the new title", error))

  return (
    <>
      {!editMode && <ReadModeLabel textValue={textValue} enabledEditMode={enableEditMode} />}
      {editMode && (
        <EditableTextField textValue={draftText} onTextChange={setDraftText} onCancel={onCancel} onSaveClick={onSaveClick} />
      )}
    </>
  )
}

export default EditableLabel
