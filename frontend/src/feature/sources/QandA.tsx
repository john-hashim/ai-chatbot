import { documentService } from '@/api/services/document'
import { TextEditor } from '@/components/common/TextEditor'
import { useApi } from '@/hooks/useApi'
import { useChatbotStore } from '@/store'
import type { ApiResponse } from '@/types/api'
import type { Document, TextDocumentUploadParams } from '@/types/document'
import { showLoadingNotification } from '@/utils/notifications'
import { htmlToPlainText, calculateTextSize } from '@/utils/textFormatting'
import { Button, TextInput } from '@mantine/core'
import { Loader2, Plus, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { DocumentSourceTable } from './DocumentSourceTable'
import type { DocumentSourceTableRef } from './DocumentSourceTable'

export const UploadQandA: React.FC = () => {
  const [value, setValue] = useState('')
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<string[]>([''])
  const { currentChatbot, addDocument } = useChatbotStore()
  const tableRef = useRef<DocumentSourceTableRef>(null)

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
        tableRef.current?.reset()
        notification.success('File Uploaded Successfully')
        setTitle('')
        setQuestions([''])
        setValue('')
      } else {
        notification.error('Failed to upload file')
      }
    }
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
        <DocumentSourceTable ref={tableRef} documentType="q&a" title="Q&A sources" />
      ) : (
        ''
      )}
    </div>
  )
}
