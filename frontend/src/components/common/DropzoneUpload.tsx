import React from 'react'
import { Dropzone, PDF_MIME_TYPE, type FileWithPath } from '@mantine/dropzone'
import { Upload } from 'lucide-react'

interface DropzoneUploadProps {
  onFilesSelected: (files: FileWithPath[]) => void
}

export const DropzoneUpload: React.FC<DropzoneUploadProps> = ({ onFilesSelected }) => {
  // useEffect(() => {
  //   if (files.length > 0) {
  //     const id = notifications.show({
  //       loading: true,
  //       title: 'Uploading File',
  //       message: 'Please wait we uploading your file',
  //       autoClose: false,
  //       withCloseButton: false,
  //     })
  //     setTimeout(() => {
  //       notifications.update({
  //         id,
  //         color: 'teal',
  //         title: 'Success',
  //         message: 'File Uploaded Successfully',
  //         icon: <CircleCheck color="#58a182" size={24} />,
  //         loading: false,
  //         autoClose: 2000,
  //       })
  //     }, 3000)
  //   }
  // }, [])

  const handleDrop = (files: FileWithPath[]) => {
    onFilesSelected(files)
  }

  return (
    <div>
      <Dropzone accept={PDF_MIME_TYPE} onDrop={handleDrop} multiple>
        <div className="flex items-center justify-center flex-col">
          <Upload className="h-4 w-4" />
          <p className="text-sm mt-2">Drag & drop files here, or click to select files</p>
          <p className="text-xs mt-1 text-text-weak">Supported file types: pdf, doc, docx, txt</p>
        </div>
      </Dropzone>
    </div>
  )
}
