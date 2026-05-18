import { useRef, useState } from 'react'
import { TextEditor } from '../../components/common/TextEditor'
import { Button, TextInput } from '@mantine/core'
import { isAxiosError } from 'axios'
import type { ApiResponse } from '@/types/api'
import { useApi } from '@/hooks/useApi'
import { documentService } from '@/api/services/document'
import type { Document, TextDocumentUploadParams } from '@/types/document'
import { Loader2 } from 'lucide-react'
import { useChatbotStore } from '@/store'
import { showLoadingNotification } from '@/utils/notifications'
import { htmlToPlainText, calculateTextSize } from '@/utils/textFormatting'
import { DocumentSourceTable } from './DocumentSourceTable'
import type { DocumentSourceTableRef } from './DocumentSourceTable'

export const UploadText: React.FC = () => {
  const [value, setValue] = useState('')
  const [title, setTitle] = useState('')
  const { currentChatbot, addDocument } = useChatbotStore()
  const tableRef = useRef<DocumentSourceTableRef>(null)

  const { execute: excuteTextSnippetCreate, loading } = useApi<
    ApiResponse<Document>,
    [TextDocumentUploadParams, string]
  >(documentService.uploadTextSnippet)

  const handleChange = (newValue: string) => {
    setValue(newValue)
  }

  const handleTextSnippetUpload = async () => {
    const plainText = htmlToPlainText(value)
    const formattedContent = `Title: ${title}

${plainText}`
    const size = calculateTextSize(formattedContent)
    const metadata = {
      title: title,
      originalHtml: value,
    }

    const textData: TextDocumentUploadParams = {
      name: title,
      type: 'text',
      subtype: 'text-snippet',
      content: formattedContent,
      size,
      metadata,
    }

    if (!currentChatbot) return

    const notification = showLoadingNotification(
      'Uploading File',
      'Please wait while we upload your file'
    )
    try {
      await excuteTextSnippetCreate(textData, currentChatbot.id)
      await addDocument()
      tableRef.current?.reset()
      notification.success('File Uploaded Successfully')
      setTitle('')
      setValue('')
    } catch (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status
        if (!status || status >= 500) {
          notification.update({ loading: false, message: '', autoClose: 1 })
          return
        }
        if (status === 400) {
          notification.error('Missing or invalid fields. Please check and try again.')
          return
        }
        if (status === 404) {
          notification.error('This chatbot no longer exists.')
          return
        }
      }
      notification.error('Could not save text snippet. Please try again.')
    }
  }

  return (
    <div className="px-4">
      <header className="text-center sm:text-left">
        <p className="text-2xl font-semibold">Text</p>
        <p className="text-sm mt-1 font-light text-text-weak max-w-2/3 mx-auto sm:mx-0">
          Add text to train your AI
        </p>
      </header>
      <div className="mt-10">
        <p className="text-text-secondary text-sm">Title</p>
        <TextInput
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="mt-1"
          type="text"
          id="text-title"
          placeholder="Pricings Plans"
        />
      </div>
      <div className="mt-5">
        {' '}
        <TextEditor value={value} onChange={handleChange} placeholder="Enter your text here..." />
      </div>
      <div className="mt-5 flex justify-end">
        <Button
          onClick={() => handleTextSnippetUpload()}
          variant="default"
          disabled={!title.trim() || !value.trim() || loading}
          leftSection={loading ? <Loader2 size={16} className="animate-spin" /> : null}
        >
          {loading ? 'Saving...' : 'Save text snippet'}
        </Button>
      </div>
      {currentChatbot && currentChatbot.textCount && currentChatbot.textCount > 0 ? (
        <DocumentSourceTable ref={tableRef} documentType="text" title="Text sources" />
      ) : (
        ''
      )}
    </div>
  )
}
