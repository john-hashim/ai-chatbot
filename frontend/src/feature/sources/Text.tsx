import '@mantine/tiptap/styles.css'

export const UploadText: React.FC = () => {
  return (
    <div className="px-4">
      <header className="text-center sm:text-left">
        <p className="text-2xl font-semibold">Text</p>
        <p className="text-sm mt-1 font-light text-text-weak max-w-2/3 mx-auto sm:mx-0">
          Add text to train your AI
        </p>
      </header>
    </div>
  )
}
