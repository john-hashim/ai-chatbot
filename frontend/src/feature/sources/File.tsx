import { DropzoneUpload } from '../../components/common/DropzoneUpload'
import { Search, ChevronDown } from 'lucide-react'
import { TextInput } from '@mantine/core'
import { Checkbox } from '@mantine/core'
import { Select } from '@mantine/core'
import classes from '@/theme.module.css'
import { useState } from 'react'
import type { FileWithPath } from '@mantine/dropzone'
import { showLoadingNotification } from '@/utils/notifications'
import { useApi } from '@/hooks/useApi'
import type { ApiResponse } from '@/types/api'
import { chatbotService } from '@/api/services/chatbot'
import { useChatbotStore } from '@/store'
import type { Document } from '@/types/document'

export const UploadFile: React.FC = () => {
  const [value, setValue] = useState<string | null>('Newest')
  const { currentChatbot, addDocument } = useChatbotStore()

  const { execute: excuteUploadDocument } = useApi<ApiResponse<Document[]>, [File[], string]>(
    chatbotService.uploadDocuments
  )

  const onFileDrop = async (files: FileWithPath[]) => {
    const notification = showLoadingNotification(
      'Uploading File',
      'Please wait while we upload your file'
    )
    if (currentChatbot) {
      const resp = await excuteUploadDocument(files, currentChatbot.id)
      if (resp.status === 'success' && resp.data) {
        addDocument(resp.data)
        notification.success('File Uploaded Successfully')
      } else {
        notification.error('Failed to upload file')
      }
    }
  }
  return (
    <div className="px-4">
      <header className="">
        <p className="text-2xl font-semibold text-center sm:text-left">Files</p>
        <p className="text-sm mt-1 font-light text-text-weak text-center sm:text-left max-w-2/3">
          Add documents to train your chatbot
        </p>
      </header>
      <div className="mt-8">
        <DropzoneUpload onFilesSelected={onFileDrop} />
      </div>
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <p className="text-md font-semibold text-center sm:text-left">File sources</p>
          <div>
            {' '}
            <TextInput
              className="mt-1"
              type="text"
              id="search-file"
              placeholder="Search"
              leftSection={<Search size={16} />}
            />
          </div>
        </div>
        <div className="flex items-center mt-6 justify-between">
          <Checkbox defaultChecked label="Select All" />
          <div className="flex items-center">
            <p className="text-sm mr-2">Sort By:</p>
            <div style={{ width: 'fit-content', minWidth: '120px' }}>
              <Select
                placeholder="Pick value"
                data={['Oldest', 'Newest', 'Status', 'Alphabetical(A-Z)', 'Alphabetical(Z-A)']}
                checkIconPosition="right"
                classNames={{ input: classes.selectInputBorderless }}
                rightSection={<ChevronDown size={16} />}
                comboboxProps={{ width: 200, position: 'bottom-end' }}
                value={value}
                onChange={setValue}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="border-b mt-2 border-border-week"></div>
      {}
    </div>
  )
}
