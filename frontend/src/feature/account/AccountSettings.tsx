import type React from 'react'
import { useRef, useState } from 'react'
import { Button, TextInput, Modal, Text, FileButton, Group, Tooltip } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useNavigate } from 'react-router-dom'
import { ImageUp, Loader2, X } from 'lucide-react'
import { modals } from '@mantine/modals'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useUserStore, useChatbotStore } from '@/store'
import { useApi } from '@/hooks/useApi'
import { useUserAvatarUpload } from '@/hooks/useUserAvatarUpload'
import { authService } from '@/api/services/auth'
import { showNotification } from '@/utils/notifications'
import { CropperComponent } from '@/components/common/Cropper'
import type { ApiResponse } from '@/types/api'
import type { User } from '@/types/auth'

export const AccountSettings: React.FC = () => {
  usePageTitle('Account Settings')

  const { user, updateUser, logout } = useUserStore()
  const { clearChatbotState } = useChatbotStore()
  const navigate = useNavigate()

  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const avatarResetRef = useRef<() => void>(null)

  const {
    isUploading: isUploadingAvatar,
    upload: uploadAvatar,
    remove: removeAvatar,
  } = useUserAvatarUpload()
  const [deleteModalOpen, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false)

  const nameChanged = name.trim() !== (user?.name ?? '')
  const emailChanged = email.trim() !== (user?.email ?? '')

  const { execute: executUpdateName, loading: savingName } = useApi<ApiResponse<User>, [string]>(
    authService.updateName
  )
  const { execute: executeUpdateEmail, loading: savingEmail } = useApi<ApiResponse<User>, [string]>(
    authService.updateEmail
  )
  const { execute: executeDeleteAccount, loading: deleting } = useApi<ApiResponse, []>(
    authService.deleteAccount
  )

  const handleAvatarChange = (selectedFile: File | null) => {
    if (!selectedFile) return
    if (selectedFile.size > 1 * 1024 * 1024) {
      showNotification('error', 'Image size larger than 1MB')
      avatarResetRef.current?.()
      return
    }
    modals.open({
      title: 'Crop Profile Picture',
      size: 'lg',
      children: (
        <CropperComponent
          image={selectedFile}
          onSave={async croppedFile => {
            modals.closeAll()
            try {
              await uploadAvatar(croppedFile)
            } catch {
              avatarResetRef.current?.()
            }
          }}
          onCancel={() => {
            modals.closeAll()
            avatarResetRef.current?.()
          }}
        />
      ),
    })
  }

  const handleRemoveAvatar = async () => {
    try {
      await removeAvatar()
    } catch {
      // Error already handled in hook
    }
    avatarResetRef.current?.()
  }

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await executUpdateName(name.trim())
      if (res.data) updateUser(res.data)
      showNotification('success', 'Name updated successfully')
    } catch {
      showNotification('error', 'Failed to update name')
    }
  }

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await executeUpdateEmail(email.trim())
      if (res.data) updateUser(res.data)
      showNotification('success', 'Email updated successfully')
    } catch {
      showNotification('error', 'Failed to update email')
    }
  }

  const handleDeleteAccount = async () => {
    try {
      await executeDeleteAccount()
      closeDeleteModal()
      clearChatbotState()
      logout()
      navigate('/login')
    } catch {
      showNotification('error', 'Failed to delete account')
    }
  }

  return (
    <>
      <Modal opened={deleteModalOpen} onClose={closeDeleteModal} title="Delete account" centered>
        <Text size="sm" c="dimmed">
          Are you sure you want to delete your account? All your data and trained agents will be
          permanently deleted. <b>This action cannot be undone.</b>
        </Text>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" size="sm" onClick={closeDeleteModal} disabled={deleting}>
            Cancel
          </Button>
          <Button
            color="red"
            variant="filled"
            size="sm"
            loading={deleting}
            onClick={handleDeleteAccount}
          >
            Delete account
          </Button>
        </div>
      </Modal>

      <section className="mx-auto w-full max-w-4xl h-full overflow-y-auto">
        <header className="flex w-full flex-wrap items-center justify-start gap-4 px-5 py-6 sm:justify-between md:p-8">
          <div className="flex grow flex-col items-start gap-1">
            <h4 className="font-semibold text-2xl text-text-primary">Account</h4>
          </div>
        </header>

        <div className="flex flex-col px-5 py-6 pt-0 md:p-8 md:pt-0 gap-8">
          {/* Profile Information */}
          <div className="rounded-xl border border-border-week bg-white shadow-xs">
            <div className="px-6 pt-6">
              <p className="font-semibold text-lg text-text-primary leading-none tracking-tight">
                Profile Information
              </p>
              <p className="text-text-weak text-sm mt-1.5">Update your personal information.</p>
            </div>
            <div className="p-6">
              <form onSubmit={handleSaveName} className="flex flex-col gap-6">
                <div>
                  <p className="text-sm font-medium text-text-secondary">Profile picture</p>
                  <div className="flex justify-between items-center">
                    <p className="text-text-weak text-[12px]">JPG, PNG up to 1MB</p>
                    <div>
                      {isUploadingAvatar ? (
                        <div className="flex items-center gap-2 w-9 h-9">
                          <Loader2 className="h-6 w-6 animate-spin text-text-weak" />
                        </div>
                      ) : user?.avatar ? (
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar}
                            alt="Avatar preview"
                            className="w-9 h-9 rounded-full object-cover border-2 border-gray-200"
                            referrerPolicy="no-referrer"
                          />
                          <Tooltip label="Remove profile picture" position="bottom">
                            <button
                              type="button"
                              className="border-0 bg-transparent p-0 cursor-pointer"
                              onClick={handleRemoveAvatar}
                            >
                              <X className="h-5 w-5 text-text-weak hover:text-icon-hover shrink-0" />
                            </button>
                          </Tooltip>
                        </div>
                      ) : (
                        <Group justify="center">
                          <FileButton
                            onChange={handleAvatarChange}
                            accept="image/png,image/jpeg"
                            resetRef={avatarResetRef}
                          >
                            {props => (
                              <Button
                                {...props}
                                variant="secondary"
                                leftSection={<ImageUp size={14} />}
                              >
                                Upload image
                              </Button>
                            )}
                          </FileButton>
                        </Group>
                      )}
                    </div>
                  </div>
                </div>
                <TextInput
                  id="name"
                  name="name"
                  label="Name"
                  placeholder="John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  size="sm"
                />
                <Button
                  type="submit"
                  disabled={!nameChanged}
                  loading={savingName}
                  size="sm"
                  className="self-end"
                >
                  Save changes
                </Button>
              </form>
            </div>
          </div>

          {/* Email */}
          <div className="rounded-xl border border-border-week bg-white shadow-xs">
            <div className="px-6 pt-6">
              <p className="font-semibold text-lg text-text-primary leading-none tracking-tight">
                Email
              </p>
              <p className="text-text-weak text-sm mt-1.5">
                Please enter the email address you want to sign in with.
              </p>
            </div>
            <div className="p-6">
              <form onSubmit={handleSaveEmail} className="flex flex-col gap-4">
                <TextInput
                  id="email"
                  name="email"
                  type="email"
                  aria-label="email"
                  placeholder="Enter a valid email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="off"
                  size="sm"
                />
                <Button
                  type="submit"
                  disabled={!emailChanged}
                  loading={savingEmail}
                  size="sm"
                  className="w-full md:w-auto md:self-end"
                >
                  Save
                </Button>
              </form>
            </div>
          </div>

          {/* Danger Zone divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border-week" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-8 font-semibold text-error">Danger Zone</span>
            </div>
          </div>

          {/* Delete Account */}
          <div className="rounded-xl border border-red-200 bg-white shadow-xs">
            <div className="p-6">
              <p className="font-semibold text-lg text-error leading-none tracking-tight">
                Delete account
              </p>
              <p className="text-text-weak text-sm mt-1.5">
                Once you delete your account, there is no going back. Please be certain. All your
                uploaded data and trained agents will be deleted.{' '}
                <b>This action is not reversible</b>
              </p>
            </div>
            <div className="p-6 flex justify-end">
              <Button
                type="button"
                color="red"
                variant="filled"
                size="sm"
                className="w-full md:w-auto"
                onClick={openDeleteModal}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
