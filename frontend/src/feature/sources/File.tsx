import { DropzoneUpload } from '../../components/common/DropzoneUpload'
import { Search, ChevronDown, Ellipsis, Trash } from 'lucide-react'
import { Menu, TextInput, Tooltip, Button, Text } from '@mantine/core'
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
import { useFormat } from '@/hooks/useFormats'
import { TagComponent } from '@/components/common/tag'
import { modals } from '@mantine/modals'

export const UploadFile: React.FC = () => {
  const [value, setValue] = useState<string | null>('Newest')
  const { currentChatbot, addDocument, deleteDocument, deleteMultipleDocuments } = useChatbotStore()
  const { bytesToKB } = useFormat()
  const [documentToDelete, setDocumentsToDelete] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)

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

  const handleSelectedDocuments = (id: string) => {
    let updated: string[]
    if (documentToDelete.includes(id)) {
      updated = documentToDelete.filter(docId => docId !== id)
      console.log('After removing:', updated)
    } else {
      updated = [...documentToDelete, id]
      console.log('After adding:', updated)
    }
    setDocumentsToDelete(updated)

    if (currentChatbot) {
      setSelectAll(updated.length === currentChatbot.documents.length)
    }
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setDocumentsToDelete([])
      setSelectAll(false)
    } else {
      if (currentChatbot) {
        const allIds = currentChatbot.documents.map(doc => doc.id)
        setDocumentsToDelete(allIds)
        setSelectAll(true)
      }
    }
  }

  const handleDeleteSingle = async (documentId: string, documentName: string) => {
    modals.openConfirmModal({
      title: 'Delete your profile',
      centered: true,
      children: (
        <Text size="sm">
          {`Are you sure you want to delete "${documentName}"? This action cannot be undone.`}
        </Text>
      ),
      labels: { confirm: 'Delete Document', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        const notification = showLoadingNotification('Deleting File', 'Please wait...')
        try {
          await deleteDocument(documentId)
          notification.success('File deleted successfully')
        } catch (e) {
          notification.error(`Failed to delete file: ${e}`)
        }
      },
      onCancel: () => console.log('canceld'),
    })
  }

  const handleDeleteMultiple = async () => {
    modals.openConfirmModal({
      title: 'Delete your profile',
      centered: true,
      children: (
        <Text size="sm">
          {`Are you sure you want to delete ${documentToDelete.length} document(s)? This action cannot be undone.`}
        </Text>
      ),
      labels: { confirm: 'Delete Documents', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        const notification = showLoadingNotification(
          'Deleting Files',
          `Deleting ${documentToDelete.length} file(s)...`
        )
        try {
          const deletedCount = await deleteMultipleDocuments(documentToDelete)
          setDocumentsToDelete([])
          setSelectAll(false)
          notification.success(`Successfully deleted ${deletedCount} file(s)`)
        } catch (e) {
          notification.error(`Failed to delete files: ${e}`)
        }
      },
      onCancel: () => console.log('canceld'),
    })
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
      {currentChatbot && currentChatbot.documents.length > 0 && (
        <div>
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
              <div className="flex items-center gap-4">
                <Checkbox label="Select All" checked={selectAll} onChange={handleSelectAll} />
                {documentToDelete.length > 0 && (
                  <Button
                    color="red"
                    size="xs"
                    leftSection={<Trash size={14} />}
                    onClick={handleDeleteMultiple}
                  >
                    Delete Selected ({documentToDelete.length})
                  </Button>
                )}
              </div>
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
          {currentChatbot.documents.map(document => (
            <div>
              <div
                key={document.id}
                className="py-4 font-semibold flex justify-between items-center"
              >
                <div className="flex">
                  <div>
                    <Checkbox
                      label={document.name}
                      checked={documentToDelete.includes(document.id)}
                      onChange={() => handleSelectedDocuments(document.id)}
                    />
                    <p className="text-text-weak font-normal ml-8 text-xs">
                      {bytesToKB(document.size)} KB
                    </p>
                  </div>
                  <Tooltip label="Not Trained yet" position="bottom-end">
                    <div className="ml-2">
                      <TagComponent text="new" className="cursor-pointer" color="#97f4b9" />
                    </div>
                  </Tooltip>
                </div>
                <Menu shadow="md" width={200}>
                  <Menu.Target>
                    <Ellipsis className="h-4 w-4 text-icon cursor-pointer" />
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Item
                      color="red"
                      onClick={() => handleDeleteSingle(document.id, document.name)}
                      leftSection={<Trash size={14} />}
                    >
                      Delete
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </div>
              <div className="border-b mt-2 border-border-week"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
