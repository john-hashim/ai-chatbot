import { useEffect, useState } from 'react'
import { Dropzone, PDF_MIME_TYPE, type FileWithPath } from '@mantine/dropzone'
import { CircleCheck, Upload } from 'lucide-react'
import { notifications } from '@mantine/notifications'

export const DropzoneUpload = () => {
  const [files, setFiles] = useState<FileWithPath[]>([])

  useEffect(() => {
    if (files.length > 0) {
      const id = notifications.show({
        loading: true,
        title: 'Uploading File',
        message: 'Please wait we uploading your file',
        autoClose: false,
        withCloseButton: false,
      })
      setTimeout(() => {
        notifications.update({
          id,
          color: 'teal',
          title: 'Success',
          message: 'File Uploaded Successfully',
          icon: <CircleCheck color="#58a182" size={24} />,
          loading: false,
          autoClose: 2000,
        })
      }, 3000)
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
    </div>
  )
}
