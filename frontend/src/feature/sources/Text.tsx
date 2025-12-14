import { useState } from 'react'
import { TextEditor } from '../../components/common/TextEditor'
import { TextInput } from '@mantine/core'

export const UploadText: React.FC = () => {
  const [value, setValue] = useState('')

  const handleChange = (newValue: string) => {
    console.log('Text Editor Value:', newValue)
    setValue(newValue)
  }

  return (
    <div className="px-4">
      <header className="text-center sm:text-left">
        <p className="text-2xl font-semibold">Text</p>
        <p className="text-sm mt-1 font-light text-text-weak max-w-2/3 mx-auto sm:mx-0">
          Add text to train your AI
        </p>
      </header>
      <div className="mt-10">
        <p className="text-text-secondary text-sm">Title</p>
        <TextInput className="mt-1" type="text" id="text-title" placeholder="Pricings Plans" />
      </div>
      <div className="mt-5">
        {' '}
        <TextEditor value={value} onChange={handleChange} placeholder="Enter your text here..." />
      </div>
    </div>
  )
}
