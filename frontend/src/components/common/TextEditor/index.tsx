import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'
import EmojiPicker, { type EmojiClickData } from 'emoji-picker-react'
import { InfoIcon } from 'lucide-react'
import styles from './TextEditor.module.css'

interface TextEditorProps {
  value: string
  onChange: (value: string) => void
  minHeight?: string
  maxHeight?: string
  placeholder?: string
  className?: string
  maxLength?: number
  showCharCount?: boolean
  showEmoji?: boolean
  showUndoRedo?: boolean
  variant?: 'full' | 'simple'
  infoText?: string
}

export const TextEditor: React.FC<TextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start typing...',
  className = '',
  minHeight = '150px',
  maxLength,
  showCharCount = false,
  showEmoji = false,
  showUndoRedo = false,
  variant = 'full',
  infoText,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const quillRef = useRef<ReactQuill>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const cursorPositionRef = useRef<number>(0)

  const getPlainTextLength = (html: string) => {
    const temp = document.createElement('div')
    temp.innerHTML = html
    return temp.textContent?.length || 0
  }

  const charCount = getPlainTextLength(value)

  const handleEmojiButtonClick = useCallback(() => {
    const editor = quillRef.current?.getEditor()
    if (editor) {
      const selection = editor.getSelection()
      cursorPositionRef.current = selection?.index || editor.getLength() - 1
    }
    setShowEmojiPicker(prev => !prev)
  }, [])

  // Append emoji button and char count to toolbar
  useEffect(() => {
    if (!editorRef.current) return
    const toolbar = editorRef.current.querySelector('.ql-toolbar')
    if (!toolbar) return

    // Add emoji button
    if (showEmoji) {
      const existingEmoji = toolbar.querySelector(`.${styles.emojiButton}`)
      if (!existingEmoji) {
        const emojiBtn = document.createElement('button')
        emojiBtn.type = 'button'
        emojiBtn.className = styles.emojiButton
        emojiBtn.innerHTML = '😀'
        emojiBtn.title = 'Add emoji'
        emojiBtn.onclick = handleEmojiButtonClick
        toolbar.appendChild(emojiBtn)
      }
    }

    // Add char count
    if (showCharCount) {
      let charCountEl = toolbar.querySelector(`.${styles.charCount}`) as HTMLElement
      if (!charCountEl) {
        charCountEl = document.createElement('span')
        charCountEl.className = `${styles.charCount}${showEmoji ? ` ${styles.charCountWithBorder}` : ''}`
        toolbar.appendChild(charCountEl)
      }
      charCountEl.textContent = `${charCount}${maxLength ? ` / ${maxLength}` : ''}`
    }
  }, [showEmoji, showCharCount, charCount, maxLength, handleEmojiButtonClick])

  const modules = useMemo(
    () => ({
      toolbar: {
        container:
          variant === 'simple'
            ? [
                ['bold', 'italic', 'underline'],
                [{ align: [] }],
                ['link'],
                ...(showUndoRedo ? [['undo', 'redo']] : []),
              ]
            : [
                [{ header: [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['link'],
                ...(showUndoRedo ? [['undo', 'redo']] : []),
              ],
        ...(showUndoRedo && {
          handlers: {
            undo: function () {
              // @ts-expect-error - quill history module
              this.quill.history.undo()
            },
            redo: function () {
              // @ts-expect-error - quill history module
              this.quill.history.redo()
            },
          },
        }),
      },
      history: {
        delay: 1000,
        maxStack: 50,
        userOnly: true,
      },
    }),
    [variant, showUndoRedo]
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


  return (
    <div className={`relative ${className}`}>
      <div
        ref={editorRef}
        className={`${styles.editor} ${variant === 'simple' ? styles.editorSimple : ''}`}
        style={{ '--editor-min-height': minHeight } as React.CSSProperties}
      >
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          placeholder={placeholder}
        />
      </div>
      {showEmoji && showEmojiPicker && (
        <div className={styles.emojiPickerWrapper}>
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}
      {infoText && (
        <div className="flex items-center gap-2 bg-background-dark-week rounded-lg px-3 py-2">
          <InfoIcon className="w-4 h-4 text-gray-500 shrink-0" />
          <p className="text-xs text-gray-500">{infoText}</p>
        </div>
      )}
    </div>
  )
}
