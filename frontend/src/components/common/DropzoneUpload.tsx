import React from 'react'
import { Dropzone, MIME_TYPES, type FileWithPath } from '@mantine/dropzone'
import { Upload } from 'lucide-react'

interface DropzoneUploadProps {
  onFilesSelected: (files: FileWithPath[]) => void
}

export const DropzoneUpload: React.FC<DropzoneUploadProps> = ({ onFilesSelected }) => {
  const handleDrop = (files: FileWithPath[]) => {
    onFilesSelected(files)
  }

  return (
    <div>
      <Dropzone
        accept={[MIME_TYPES.pdf, MIME_TYPES.doc, MIME_TYPES.docx, 'text/plain']}
        onDrop={handleDrop}
        multiple
      >
        <div className="flex items-center justify-center flex-col">
          <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
          <p className="text-xs sm:text-sm mt-1 sm:mt-2 text-center px-2">Drag & drop files here, or click to select files</p>
          <p className="text-[10px] sm:text-xs mt-0.5 sm:mt-1 text-text-weak">pdf, doc, docx, txt</p>
        </div>
      </Dropzone>
    </div>
  )
}
