import { DropzoneUpload } from '../../components/common/DropzoneUpload'
import { useRef } from 'react'
import type { FileWithPath } from '@mantine/dropzone'
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
    const notification = showLoadingNotification(
      'Uploading File',
      'Please wait while we upload your file'
    )
    if (currentChatbot) {
      const resp = await excuteUploadDocument(files, currentChatbot.id)
      if (resp.status === 'success' && resp.data) {
        await addDocument()
        tableRef.current?.reset()
        notification.success('File Uploaded Successfully')
      } else {
        notification.error('Failed to upload file')
      }
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
