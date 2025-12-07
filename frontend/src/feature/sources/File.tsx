import { DropzoneUpload } from '../../components/common/DropzoneUpload'

export const UploadFile: React.FC = () => {
  return (
    <div className="px-4">
      <header className="">
        <p className="text-2xl font-semibold text-center sm:text-left">Files</p>
        <p className="text-sm mt-1 font-light text-text-weak text-center sm:text-left max-w-2/3">
          Add documents to train your chatbot
        </p>
      </header>
      <div className="mt-8">
        <DropzoneUpload />
      </div>
    </div>
  )
}
