import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Button, Checkbox, Select, TextInput, Text, Tooltip, Menu } from '@mantine/core'
import { ChevronDown, Ellipsis, Loader2, Search, SearchX, Trash } from 'lucide-react'
import { useChatbotStore } from '@/store'
import type { SortOption } from '@/types/common'
import { useFormat } from '@/hooks/useFormats'
import { showLoadingNotification } from '@/utils/notifications'
import classes from '@/theme.module.css'
import { modals } from '@mantine/modals'
import { TagComponent } from '@/components/common/tag'

interface DocumentSourceTableProps {
  documentType: string
  title: string
}

export interface DocumentSourceTableRef {
  reset: () => void
}

export const DocumentSourceTable = forwardRef<DocumentSourceTableRef, DocumentSourceTableProps>(
  ({ documentType, title }, ref) => {
    const {
      currentChatbot,
      deleteDocument,
      deleteMultipleDocuments,
      setDocumentFilters,
      documentFilters,
      getChatbot,
      isLoadingChatbot,
    } = useChatbotStore()
    const { formatFileSize } = useFormat()
    const [documentToDelete, setDocumentsToDelete] = useState<string[]>([])
    const [selectAll, setSelectAll] = useState(false)
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null)

    const filteredDocuments =
      currentChatbot?.documents.filter(doc => doc.type === documentType) ?? []

    useImperativeHandle(ref, () => ({
      reset: () => {
        setDocumentsToDelete([])
        setSelectAll(false)
      },
    }))

    const handleSelectedDocuments = (id: string) => {
      let updated: string[]
      if (documentToDelete.includes(id)) {
        updated = documentToDelete.filter(docId => docId !== id)
      } else {
        updated = [...documentToDelete, id]
      }
      setDocumentsToDelete(updated)
      setSelectAll(updated.length === filteredDocuments.length)
    }

    const handleSelectAll = () => {
      if (selectAll) {
        setDocumentsToDelete([])
        setSelectAll(false)
      } else {
        setDocumentsToDelete(filteredDocuments.map(doc => doc.id))
        setSelectAll(true)
      }
    }

    const handleSearch = (query: string) => {
      setDocumentFilters({ ...documentFilters, searchParam: query })
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
      searchTimeoutRef.current = setTimeout(() => {
        getChatbot()
      }, 300)
    }

    const handleSortChange = (value: string | null) => {
      if (value) {
        setDocumentFilters({ ...documentFilters, sortBy: value as SortOption })
        getChatbot()
      }
    }

    const handleDeleteSingle = (documentId: string, documentName: string) => {
      modals.openConfirmModal({
        title: `Delete ${title.toLowerCase()}`,
        centered: true,
        children: (
          <Text size="sm">
            {`Are you sure you want to delete "${documentName}"? This action cannot be undone.`}
          </Text>
        ),
        labels: { confirm: 'Delete Document', cancel: 'Cancel' },
        confirmProps: { color: 'red', variant: 'filled' },
        onConfirm: async () => {
          const notification = showLoadingNotification('Deleting source', 'Please wait...')
          try {
            await deleteDocument(documentId)
            notification.success('Source deleted successfully')
            setDocumentsToDelete([])
          } catch (e) {
            notification.error(`Failed to delete: ${e}`)
            setDocumentsToDelete([])
          }
        },
      })
    }

    const handleDeleteMultiple = () => {
      modals.openConfirmModal({
        title: `Delete ${title.toLowerCase()}`,
        centered: true,
        children: (
          <Text size="sm">
            {`Are you sure you want to delete ${documentToDelete.length} source(s)? This action cannot be undone.`}
          </Text>
        ),
        labels: { confirm: 'Delete Documents', cancel: 'Cancel' },
        confirmProps: { color: 'red', variant: 'filled' },
        onConfirm: async () => {
          const notification = showLoadingNotification(
            'Deleting sources',
            `Deleting ${documentToDelete.length} source(s)...`
          )
          try {
            const deletedCount = await deleteMultipleDocuments(documentToDelete)
            setDocumentsToDelete([])
            setSelectAll(false)
            notification.success(`Successfully deleted ${deletedCount} source(s)`)
          } catch (e) {
            notification.error(`Failed to delete: ${e}`)
          }
        },
      })
    }

    return (
      <div>
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <p className="text-md font-semibold text-center sm:text-left">{title}</p>
            <TextInput
              className="mt-1"
              type="text"
              placeholder="Search"
              leftSection={<Search size={16} />}
              value={documentFilters.searchParam}
              onChange={e => handleSearch(e.target.value)}
            />
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between gap-2">
              <Checkbox
                label={<span className="text-xs sm:text-sm">Select All</span>}
                checked={selectAll}
                onChange={handleSelectAll}
              />
              <div className="flex items-center">
                <p className="text-xs sm:text-sm mr-2 hidden sm:block">Sort By:</p>
                <div style={{ width: 'fit-content', minWidth: '100px' }}>
                  <Select
                    placeholder="Sort"
                    data={['Default', 'Oldest', 'Newest', 'Alphabetical(A-Z)', 'Alphabetical(Z-A)']}
                    checkIconPosition="right"
                    classNames={{ input: classes.selectInputBorderless }}
                    rightSection={<ChevronDown size={16} />}
                    comboboxProps={{ width: 200, position: 'bottom-end' }}
                    value={documentFilters.sortBy}
                    onChange={handleSortChange}
                  />
                </div>
              </div>
            </div>
            {documentToDelete.length > 0 && (
              <div className="mt-3 div-fade-animation">
                <Button
                  color="#ff0000"
                  variant="filled"
                  size="xs"
                  leftSection={<Trash size={14} />}
                  onClick={handleDeleteMultiple}
                >
                  Delete Selected ({documentToDelete.length})
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="border-b mt-2 border-border-week"></div>
        {isLoadingChatbot ? (
          <div className="flex items-center justify-center py-12">
            <Loader2
              className="h-6 w-6 animate-spin"
              style={{ color: 'var(--mantine-color-brand-6)' }}
            />
          </div>
        ) : filteredDocuments.length > 0 ? (
          filteredDocuments.map(document => (
            <div key={document.id}>
              <div className="py-4 font-semibold flex justify-between items-center">
                <div className="flex">
                  <div>
                    <Checkbox
                      label={document.name}
                      checked={documentToDelete.includes(document.id)}
                      onChange={() => handleSelectedDocuments(document.id)}
                    />
                    <p className="text-text-weak font-normal ml-8 text-xs">
                      {formatFileSize(document.size)}
                    </p>
                  </div>
                  {document.status === 'untrained' && (
                    <Tooltip label="Not Trained yet" position="bottom-end">
                      <div className="ml-2">
                        <TagComponent text="new" className="cursor-pointer" color="#97f4b9" />
                      </div>
                    </Tooltip>
                  )}
                </div>
                <Menu shadow="md" width={200}>
                  <Menu.Target>
                    <Ellipsis className="h-4 w-4 text-icon cursor-pointer mr-6" />
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
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-text-weak">
            <SearchX className="h-6 w-6 mb-3 opacity-50" />
            <p className="text-lg font-medium">No results found</p>
          </div>
        )}
      </div>
    )
  }
)
