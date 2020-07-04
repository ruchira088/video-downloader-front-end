import React, {useState} from "react"
import styles from "./EditableLabel.module.css"
import {TextField} from "@material-ui/core";

const ReadModeLabel =
    ({textValue, enabledEditMode}: { textValue: string, enabledEditMode: () => void }) => {
        const [showEdit, setShowEdit] = useState(false)

        return (
            <div className={styles.readModeLabel} onMouseEnter={() => setShowEdit(true)}
                 onMouseLeave={() => setShowEdit(false)}>
                {textValue}
                {showEdit && <button onClick={enabledEditMode}>Edit</button>}
            </div>
        )
    }

const EditableTextField =
    ({textValue, onTextChange, onCancel, onSaveClick}: { textValue: string, onTextChange: (text: string) => void, onCancel: () => void, onSaveClick: (text: string) => void }) =>
        <>
            <TextField label="Title" value={textValue} onChange={event => onTextChange(event.target.value)}/>
            <button onClick={() => onSaveClick(textValue)}>Save</button>
            <button onClick={onCancel}>Cancel</button>
        </>

export default ({textValue, onUpdateText}: { textValue: string, onUpdateText: (text: string) => Promise<void> }) => {
    const [text, setText] = useState(textValue)
    const [editMode, setEditMode] = useState(false)

    const onCancel = () => {
        setText(textValue)
        setEditMode(false)
    }

    const onSaveClick =
        (updatedText: string) => onUpdateText(updatedText).then(() => setEditMode(false))

    return (
        <>
            {!editMode && <ReadModeLabel textValue={text} enabledEditMode={() => setEditMode(true)}/>}
            {
                editMode &&
                <EditableTextField textValue={text} onTextChange={setText} onCancel={onCancel}
                                   onSaveClick={onSaveClick}/>
            }
        </>
    )
}


