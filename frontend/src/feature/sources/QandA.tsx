import { documentService } from '@/api/services/document'
import { TextEditor } from '@/components/common/TextEditor'
import { useApi } from '@/hooks/useApi'
import { useFormat } from '@/hooks/useFormats'
import { useChatbotStore } from '@/store'
import type { ApiResponse } from '@/types/api'
import type { Document, SortOption, TextDocumentUploadParams } from '@/types/document'
import { showLoadingNotification } from '@/utils/notifications'
import { htmlToPlainText, calculateTextSize } from '@/utils/textFormatting'
import { Button, Checkbox, Select, TextInput, Text, Tooltip, Menu } from '@mantine/core'
import { ChevronDown, Ellipsis, Loader2, Plus, Search, SearchX, Trash, X } from 'lucide-react'
import { useRef, useState } from 'react'
import classes from '@/theme.module.css'
import { modals } from '@mantine/modals'
import { TagComponent } from '@/components/common/tag'

export const UploadQandA: React.FC = () => {
  const [value, setValue] = useState('')
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<string[]>([''])
  const {
    currentChatbot,
    addDocument,
    documentFilters,
    setDocumentFilters,
    getChatbot,
    deleteMultipleDocuments,
    deleteDocument,
  } = useChatbotStore()
  const [selectAll, setSelectAll] = useState(false)
  const { formatFileSize } = useFormat()
  const [documentToDelete, setDocumentsToDelete] = useState<string[]>([])

  const { execute: excuteTextSnippetCreate, loading } = useApi<
    ApiResponse<Document>,
    [TextDocumentUploadParams, string]
  >(documentService.uploadTextSnippet)

  const handleChange = (newValue: string) => {
    setValue(newValue)
  }

  const handleQuestionChange = (index: number, value: string) => {
    const updatedQuestions = [...questions]
    updatedQuestions[index] = value
    setQuestions(updatedQuestions)
  }

  const addQuestion = () => {
    setQuestions([...questions, ''])
  }

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      const updatedQuestions = questions.filter((_, i) => i !== index)
      setQuestions(updatedQuestions)
    }
  }

  const handleTextSnippetUpload = async () => {
    const answerPlain = htmlToPlainText(value)
    const questionsText = questions.filter(q => q.trim()).join('\n')
    const formattedContent = `Questions:
${questionsText}

Answer:
${answerPlain}`
    const size = calculateTextSize(formattedContent)
    const documentName = title.length > 50 ? `${title.substring(0, 50)}...` : title

    const metadata = {
      title,
      questions: questions.filter(q => q.trim()),
      answer: answerPlain,
      originalAnswerHtml: value,
    }

    const textData: TextDocumentUploadParams = {
      name: documentName,
      type: 'q&a',
      subtype: 'q&a-snippet',
      content: formattedContent,
      size,
      metadata,
    }

    if (currentChatbot) {
      const notification = showLoadingNotification(
        'Uploading File',
        'Please wait while we upload your file'
      )
      const resp = await excuteTextSnippetCreate(textData, currentChatbot?.id)
      if (resp.status === 'success' && resp.data) {
        await addDocument()
        notification.success('File Uploaded Successfully')
        setTitle('')
        setQuestions([''])
        setValue('')
      } else {
        notification.error('Failed to upload file')
      }
    }
  }

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null)

  const handleSearch = (query: string) => {
    setDocumentFilters({ ...documentFilters, searchParam: query })
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      getChatbot()
    }, 300)
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setDocumentsToDelete([])
      setSelectAll(false)
    } else {
      if (currentChatbot) {
        const allIds = currentChatbot.documents.filter(doc => doc.type === 'q&a').map(doc => doc.id)
        setDocumentsToDelete(allIds)
        setSelectAll(true)
      }
    }
  }

  const handleSortChange = (value: string | null) => {
    if (value) {
      setDocumentFilters({ ...documentFilters, sortBy: value as SortOption })
      getChatbot()
    }
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
      confirmProps: { color: 'red', variant: 'filled' },
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

  const handleSelectedDocuments = (id: string) => {
    let updated: string[]
    if (documentToDelete.includes(id)) {
      updated = documentToDelete.filter(docId => docId !== id)
    } else {
      updated = [...documentToDelete, id]
    }
    setDocumentsToDelete(updated)

    if (currentChatbot) {
      const textDocumentsCount = currentChatbot.documents.filter(doc => doc.type === 'text').length
      setSelectAll(updated.length === textDocumentsCount)
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
      confirmProps: { color: 'red', variant: 'filled' },
      onConfirm: async () => {
        const notification = showLoadingNotification('Deleting File', 'Please wait...')
        try {
          await deleteDocument(documentId)
          setDocumentsToDelete([])
          notification.success('File deleted successfully')
        } catch (e) {
          notification.error(`Failed to delete file: ${e}`)
          setDocumentsToDelete([])
        }
      },
      onCancel: () => console.log('canceld'),
    })
  }

  return (
    <div className="px-4">
      <header className="text-center sm:text-left">
        <p className="text-2xl font-semibold">Q&A</p>
        <p className="text-sm mt-1 font-light text-text-weak max-w-2/3 mx-auto sm:mx-0">
          Teach your AI how to respond to frequently asked questions
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
        <p className="text-text-secondary text-sm mb-1">Questions</p>
        {questions.map((question, index) => (
          <div key={index} className="mb-3">
            <div className="flex gap-2 items-start">
              <TextInput
                value={question}
                onChange={e => handleQuestionChange(index, e.target.value)}
                className="flex-1"
                type="text"
                placeholder="What are your pricing plans?"
              />
              {questions.length > 1 && (
                <Button
                  variant="secondary"
                  color="red"
                  size="sm"
                  onClick={() => removeQuestion(index)}
                  px="xs"
                >
                  <X size={16} />
                </Button>
              )}
            </div>
            {index === questions.length - 1 && (
              <Button
                variant="secondary"
                size="xs"
                className="mt-2"
                leftSection={<Plus size={14} />}
                onClick={addQuestion}
              >
                Add Question
              </Button>
            )}
          </div>
        ))}
      </div>
      <div className="mt-5">
        <p className="text-text-secondary text-sm">Answer</p>
        <TextEditor
          className="mt-1"
          value={value}
          onChange={handleChange}
          placeholder="Enter your text here..."
        />
      </div>
      <div className="mt-5 flex justify-end">
        <Button
          onClick={() => handleTextSnippetUpload()}
          variant="default"
          disabled={!title.trim() || !value.trim() || !questions.some(q => q.trim()) || loading}
          leftSection={loading ? <Loader2 size={16} className="animate-spin" /> : null}
        >
          {loading ? 'Saving...' : 'Save Q&A'}
        </Button>
      </div>
      {currentChatbot && currentChatbot.QandACount && currentChatbot.QandACount > 0 ? (
        <div>
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <p className="text-md font-semibold text-center sm:text-left">Text sources</p>
              <div>
                {' '}
                <TextInput
                  className="mt-1"
                  type="text"
                  id="search-file"
                  placeholder="Search"
                  leftSection={<Search size={16} />}
                  value={documentFilters.searchParam}
                  onChange={e => handleSearch(e.target.value)}
                />
              </div>
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
                      data={[
                        'Default',
                        'Oldest',
                        'Newest',
                        'Alphabetical(A-Z)',
                        'Alphabetical(Z-A)',
                      ]}
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
          {currentChatbot.documents && currentChatbot.documents.length > 0 ? (
            currentChatbot.documents
              .filter(document => document.type === 'q&a')
              .map(document => (
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
              ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-text-weak">
              <SearchX className="h-6 w-6 mb-3 opacity-50" />
              <p className="text-lg font-medium">No results found</p>
            </div>
          )}
        </div>
      ) : (
        ''
      )}
    </div>
  )
}
