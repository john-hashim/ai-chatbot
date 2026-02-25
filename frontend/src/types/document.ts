export interface Document {
  id: string
  chatbotId: string
  name: string
  type: string
  subtype?: string
  content: string
  size: number
  metadata: object
  status: string
  uploadedAt: Date
  updatedAt: Date
}

export type TextDocumentUploadParams = Pick<
  Document,
  'name' | 'type' | 'subtype' | 'content' | 'size' | 'metadata'
>
