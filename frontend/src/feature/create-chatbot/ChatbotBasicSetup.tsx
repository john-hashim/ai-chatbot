import { Logo } from '@/components/common/logo'
import {
  TextInput,
  SegmentedControl,
  Center,
  ColorInput,
  Switch,
  FileButton,
  Button,
  Group,
} from '@mantine/core'
import { ArrowLeft, X, Sun, Moon, ImageUp, CircleAlert, CircleCheck } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { notifications } from '@mantine/notifications'
import { modals } from '@mantine/modals'
import { CropperComponent } from '@/components/common/Cropper'
import { useForm, Controller } from 'react-hook-form'
import { type ApiResponse, type Chatbot, type ChatbotFormData } from '@/types/chatbot'
import { chatbotService } from '@/api/services/chatbot'
import { useApi } from '@/hooks/useApi'
import { AxiosError } from 'axios'
import { useStore } from '@/store'

export const ChatbotBasicSetup: React.FC = () => {
  const navigate = useNavigate()
  const upsertChatbot = useStore(state => state.upsertChatbot)

  const { execute: excuteCreateChatbot } = useApi<ApiResponse<Chatbot>, [ChatbotFormData]>(
    chatbotService.createChatbot
  )

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const ProfilePictureResetRef = useRef<() => void>(null)
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ChatbotFormData>({
    defaultValues: {
      name: '',
      appearance: 'light',
      brandColor: '#2563eb',
      brandColorForHeader: true,
      profilePicture: null,
    },
  })

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      const maxSizeInBytes = 1 * 1024 * 1024
      if (selectedFile.size > maxSizeInBytes) {
        notifications.show({
          message: 'Image size larger than 1MB',
          className: 'error',
          icon: <CircleAlert color="#c72027" size={18} />,
        })
        ProfilePictureResetRef.current?.()
        return
      }
      openCropperModal(selectedFile)
    }
  }

  const openCropperModal = (imageFile: File) => {
    modals.open({
      title: 'Crop Profile Picture',
      size: 'lg',
      children: (
        <CropperComponent
          image={imageFile}
          onSave={handleCroppedImage}
          onCancel={() => {
            modals.closeAll()
            ProfilePictureResetRef.current?.()
          }}
        />
      ),
    })
  }

  const handleCroppedImage = (croppedFile: File) => {
    setFile(croppedFile)
    setValue('profilePicture', croppedFile)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    const newPreviewUrl = URL.createObjectURL(croppedFile)
    setPreviewUrl(newPreviewUrl)
    modals.closeAll()
  }

  const clearFile = () => {
    setFile(null)
    setValue('profilePicture', null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    ProfilePictureResetRef.current?.()
  }

  const onSubmit = async (data: ChatbotFormData) => {
    try {
      const response = await excuteCreateChatbot(data)

      // Store the chatbot from API response
      if (response?.data) {
        upsertChatbot(response.data)
      }

      notifications.show({
        message: 'Chatbot created successfully!',
        className: 'success',
        icon: <CircleCheck color="#58a182" size={18} />,
      })
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string; code?: string }>
      if (axiosError.response?.status === 409) {
        notifications.show({
          message: 'A chatbot with this name already exists. Please choose a different name.',
          className: 'error',
          icon: <CircleAlert color="#c72027" size={18} />,
        })
      }
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="px-5 py-2 flex items-center justify-between">
        <div
          className="p-1 hover:bg-icon-bg-hover rounded cursor-pointer"
          data-tooltip-id="global-tooltip"
          data-tooltip-content="Go Back"
          data-tooltip-place="bottom-start"
          onClick={() => navigate('/landing')}
        >
          <ArrowLeft className="h-5 w-5 text-text-weak hover:text-icon-hover" />
        </div>
        <Logo height={40} width={28} fontSize={25} logoIcon={false} />
        <X
          data-tooltip-id="global-tooltip"
          data-tooltip-content="Close"
          data-tooltip-place="bottom-end"
          className="h-5 w-5 text-text-weak hover:text-icon-hover cursor-pointer"
          onClick={() => navigate('/landing')}
        />
      </div>
      <div className="lg:px-32 px-6 flex-1 pt-1 pb-15 flex flex-wrap">
        <div className="border flex-1 border-border-week lg:mt-0 rounded-2xl flex overflow-hidden">
          <div className="lg:w-1/2 w-full h-full border-r border-border-week lg:p-20 px-8 py-12">
            <form onSubmit={handleSubmit(onSubmit)}>
              <p className="text-3xl font-semibold text-center sm:text-left">
                Let's Build Your Chatbot
              </p>
              <p className="text-sm font-light text-center sm:text-left">
                Customize your agent's look now. Additional styling options in settings.
              </p>
              <div className="mt-10">
                <p className="text-text-secondary text-sm">What's your chatbot's name?</p>
                <TextInput
                  {...register('name', { required: 'Please provide your chatbot name' })}
                  className="mt-1"
                  type="text"
                  id="chatbotname"
                  placeholder="Luna AI"
                  error={errors.name?.message}
                />
              </div>
              <div className="h-0.5 mt-6 border-t border-gray-100"></div>
              <div className="flex justify-between items-center mt-6">
                <p className="text-text-secondary text-sm">Appearance</p>
                <Controller
                  name="appearance"
                  control={control}
                  render={({ field }) => (
                    <SegmentedControl
                      {...field}
                      data={[
                        {
                          value: 'light',
                          label: (
                            <Center style={{ gap: 10 }}>
                              <Sun size={16} />
                            </Center>
                          ),
                        },
                        {
                          value: 'dark',
                          label: (
                            <Center style={{ gap: 10 }}>
                              <Moon size={16} />
                            </Center>
                          ),
                        },
                      ]}
                    />
                  )}
                />
              </div>
              <div className="flex justify-between items-center mt-6">
                <p className="text-text-secondary text-sm">Choose your brand color</p>
                <div className="w-1/3">
                  <Controller
                    name="brandColor"
                    control={control}
                    render={({ field }) => (
                      <ColorInput
                        {...field}
                        swatchesPerRow={5}
                        closeOnColorSwatchClick
                        withEyeDropper={false}
                        swatches={['#2563eb', '#7c3aed', '#10b981', '#f59e0b', '#ef4444']}
                      />
                    )}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center mt-6">
                <p className="text-text-secondary text-sm">Use brand color for header</p>
                <div>
                  <Controller
                    name="brandColorForHeader"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <Switch
                        checked={value}
                        onChange={event => onChange(event.currentTarget.checked)}
                        color="teal"
                      />
                    )}
                  />
                </div>
              </div>
              <div className="h-0.5 mt-6 border-t border-gray-100"></div>
              <div className="mt-6">
                <p className="text-text-secondary text-sm">Profile Picture</p>
                <div className="flex justify-between items-center mt-4">
                  <p className="text-text-weak text-[12px]">JPG, PNG, and SVG up to 1MB</p>
                  <div>
                    {file && previewUrl ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={previewUrl}
                          alt="Profile preview"
                          className="w-9 h-9 rounded-full object-cover border-2 border-gray-200"
                        />
                        <X
                          data-tooltip-id="global-tooltip"
                          data-tooltip-content="Remove Profile Picture"
                          data-tooltip-place="bottom"
                          className="h-5 w-5 text-text-weak hover:text-icon-hover cursor-pointer shrink-0"
                          onClick={clearFile}
                        />
                      </div>
                    ) : (
                      <Group justify="center">
                        <FileButton
                          onChange={handleFileChange}
                          accept="image/png,image/jpeg"
                          resetRef={ProfilePictureResetRef}
                        >
                          {props => (
                            <Button {...props} leftSection={<ImageUp size={14} />}>
                              Upload image
                            </Button>
                          )}
                        </FileButton>
                      </Group>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-10 flex justify-center items-center">
                <Button
                  type="submit"
                  onClick={() => navigate('/chatbot/1321/setup-knowledgebase')}
                  variant="default"
                  style={{ width: '75%' }}
                  disabled={!!errors.name}
                >
                  Save And Continue
                </Button>
              </div>
            </form>
          </div>
          <div className="w-1/2 h-full hidden lg:block bg-[radial-gradient(circle,#ebebeb_2px,#fafafa_0)] bg-size-[30px_30px]"></div>
        </div>
      </div>
    </div>
  )
}
