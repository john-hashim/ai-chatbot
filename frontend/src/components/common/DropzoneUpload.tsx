import { useEffect, useState } from 'react'
import { Dropzone, PDF_MIME_TYPE, type FileWithPath } from '@mantine/dropzone'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'

export const DropzoneUpload = () => {
  const [files, setFiles] = useState<FileWithPath[]>([])

  useEffect(() => {
    if (files.length > 0) {
      toast.success(files[0].name)
    }
  }, [files])

  return (
    <div>
      <Dropzone accept={PDF_MIME_TYPE} onDrop={setFiles} multiple>
        <div className="flex items-center justify-center flex-col">
          <Upload className="h-4 w-4" />
          <p className="text-sm mt-2">Drag & drop files here, or click to select files</p>
          <p className="text-xs mt-1 text-text-weak">Supported file types: pdf, doc, docx, txt</p>
        </div>
      </Dropzone>
      {/* {files && files.map(file => <div>{file.name}</div>)} */}
    </div>
  )
}
