import { useState, useMemo, useRef } from 'react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react'
import styles from './TextEditor.module.css'

interface TextEditorProps {
  value: string
  onChange: (value: string) => void
  minHeight?: string
  maxHeight?: string
  placeholder?: string
  className?: string
}

export const TextEditor: React.FC<TextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start typing...',
  className = '',
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const quillRef = useRef<ReactQuill>(null)
  const cursorPositionRef = useRef<number>(0)

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link'],
        ],
      },
    }),
    []
  )

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const editor = quillRef.current?.getEditor()
    if (editor) {
      const position = cursorPositionRef.current
      editor.insertText(position, emojiData.emoji)
      editor.setSelection(position + emojiData.emoji.length, 0)
    }
    setShowEmojiPicker(false)
  }

  const handleEmojiButtonClick = () => {
    const editor = quillRef.current?.getEditor()
    if (editor) {
      const selection = editor.getSelection()
      cursorPositionRef.current = selection?.index || editor.getLength() - 1
    }
    setShowEmojiPicker(!showEmojiPicker)
  }

  return (
    <div className={`relative ${className}`}>
      <div className={styles.editor}>
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          placeholder={placeholder}
        />
      </div>
      <button
        type="button"
        onClick={handleEmojiButtonClick}
        className="absolute top-2 right-2 px-3 py-1 text-lg hover:bg-gray-100 rounded"
        title="Add emoji"
      >
        😀
      </button>
      {showEmojiPicker && (
        <div className="absolute top-14 right-2 z-50">
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}
    </div>
  )
}
