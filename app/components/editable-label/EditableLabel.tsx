import React, { useState } from "react"
import styles from "./EditableLabel.module.css"
import { TextField } from "@mui/material"

const ReadModeLabel = ({ textValue, enabledEditMode }: { textValue: string; enabledEditMode: () => void }) => (
  <div className={styles.readModeLabel}>
    {textValue}
    <button className={styles.editButton} onClick={enabledEditMode}>Edit</button>
  </div>
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
  <>
    <TextField label="Title" value={textValue} onChange={(event) => onTextChange(event.target.value)} />
    <button onClick={() => onSaveClick(textValue)}>Save</button>
    <button onClick={onCancel}>Cancel</button>
  </>
)

const EditableLabel = ({ textValue, onUpdateText }: { textValue: string; onUpdateText: (text: string) => Promise<void> }) => {
  const [draftText, setDraftText] = useState<string>("")
  const [editMode, setEditMode] = useState(false)

  const enableEditMode = () => {
    setDraftText(textValue)
    setEditMode(true)
  }

  const onCancel = () => setEditMode(false)

  const onSaveClick = (updatedText: string) =>
    onUpdateText(updatedText)
      .then(() => setEditMode(false))
      .catch((error) => console.error("Failed to update text", error))

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
