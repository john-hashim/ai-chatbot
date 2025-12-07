import { useState } from 'react'
import { Dropzone, PDF_MIME_TYPE, type FileWithPath } from '@mantine/dropzone'
import { Search, Upload, ChevronDown } from 'lucide-react'
import { TextInput } from '@mantine/core'
import { Checkbox } from '@mantine/core'
import { Select } from '@mantine/core'
import classes from '@/theme.module.css'

export const DropzoneUpload = () => {
  const [files, setFiles] = useState<FileWithPath[]>([])

  return (
    <div>
      <Dropzone accept={PDF_MIME_TYPE} onDrop={setFiles}>
        <div className="flex items-center justify-center flex-col">
          <Upload className="h-4 w-4" />
          <p className="text-sm mt-2">Drag & drop files here, or click to select files</p>
          <p className="text-xs mt-1 text-text-weak">Supported file types: pdf, doc, docx, txt</p>
        </div>
      </Dropzone>
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
            <Select
              placeholder="Pick value"
              data={['Oldest', 'Newest', 'Status', 'Alphabetical(A-Z)', 'Alphabetical(Z-A)']}
              checkIconPosition="right"
              classNames={{ input: classes.selectInputBorderless }}
              rightSection={<ChevronDown size={16} />}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
