import { DropzoneUpload } from '../../components/common/DropzoneUpload'
import { useRef } from 'react'
import type { FileWithPath } from '@mantine/dropzone'
import { isAxiosError } from 'axios'
import { showLoadingNotification } from '@/utils/notifications'
import { useApi } from '@/hooks/useApi'
import type { ApiResponse } from '@/types/api'
import { documentService } from '@/api/services/document'
import { useChatbotStore } from '@/store'
import type { Document } from '@/types/document'
import { DocumentSourceTable } from './DocumentSourceTable'
import type { DocumentSourceTableRef } from './DocumentSourceTable'

export const UploadFile: React.FC = () => {
  const { currentChatbot, addDocument } = useChatbotStore()
  const tableRef = useRef<DocumentSourceTableRef>(null)

  const { execute: excuteUploadDocument } = useApi<ApiResponse<Document[]>, [File[], string]>(
    documentService.uploadDocuments
  )

  const onFileDrop = async (files: FileWithPath[]) => {
    if (!currentChatbot) return
    const notification = showLoadingNotification(
      'Uploading File',
      'Please wait while we upload your file'
    )
    try {
      await excuteUploadDocument(files, currentChatbot.id)
      await addDocument()
      tableRef.current?.reset()
      notification.success('File Uploaded Successfully')
    } catch (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status
        if (!status || status >= 500) {
          notification.update({ loading: false, message: '', autoClose: 1 })
          return
        }
        if (status === 400) {
          notification.error('Invalid file or missing data. Please check and try again.')
          return
        }
        if (status === 403) {
          notification.error('You do not have permission to upload to this chatbot.')
          return
        }
        if (status === 404) {
          notification.error('This chatbot no longer exists.')
          return
        }
      }
      notification.error('Could not upload file. Please try again.')
    }
  }

  return (
    <div className="px-4">
      <header className="text-center sm:text-left">
        <p className="text-2xl font-semibold">Files</p>
        <p className="text-sm mt-1 font-light text-text-weak max-w-2/3 mx-auto sm:mx-0">
          Add documents to train your chatbot
        </p>
      </header>
      <div className="mt-8">
        <DropzoneUpload onFilesSelected={onFileDrop} />
      </div>
      {currentChatbot && currentChatbot.fileCount && currentChatbot.fileCount > 0 ? (
        <DocumentSourceTable ref={tableRef} documentType="document" title="File sources" />
      ) : (
        ''
      )}
    </div>
  )
}
