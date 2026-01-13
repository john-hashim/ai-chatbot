import { Ellipsis } from 'lucide-react'

export interface OutlineProps {
  name: string
  profilePicture: null | string
  brandColor: string
  appearance: string
  brandColorForHeader: boolean
  isPreview?: boolean
}

// Utility function to determine if a color is light or dark
const getTextColorForBackground = (hexColor: string): string => {
  // Remove # if present
  const hex = hexColor.replace('#', '')

  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  // Calculate relative luminance using WCAG formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  // Return black for light colors, white for dark colors
  return luminance > 0.5 ? '#000000' : '#ffffff'
}

export const Outline: React.FC<OutlineProps> = ({
  name = '',
  profilePicture = null,
  brandColor = '#2563eb',
  appearance = 'light',
  brandColorForHeader = true,
  isPreview = false,
}) => {
  // Calculate text color for brand color (always needed for user messages)
  const textColorForBrandColor = getTextColorForBackground(brandColor)

  // Determine text color for header based on background
  const headerTextColor = brandColorForHeader
    ? textColorForBrandColor
    : appearance === 'light'
      ? '#000000'
      : '#ffffff'

  return (
    <div
      className={`h-full flex justify-center ${isPreview ? 'pt-0 scale-[0.35] origin-top' : 'pt-[100px]'}`}
    >
      <div
        className={`w-[400px] ${isPreview ? 'h-[500px]' : 'h-full'} rounded-t-3xl overflow-hidden ${appearance === 'light' ? 'bg-white' : 'bg-black'} border border-border-week`}
      >
        <div
          className="px-4 h-20 flex items-center justify-between  border-b-[0.5px]"
          style={
            brandColorForHeader
              ? {
                  backgroundImage: `linear-gradient(to bottom, ${brandColor}cc 0%, ${brandColor} 100%)`,
                  borderBottomColor: `${brandColor}33`,
                  color: headerTextColor,
                  transition: 'all 0.3s ease-in-out',
                }
              : appearance === 'light'
                ? {
                    backgroundImage: 'linear-gradient(to bottom, #ebebeb 0%, #ffffff 100%)',
                    borderBottomColor: '#d4d4d4',
                    color: headerTextColor,
                    transition: 'all 0.3s ease-in-out',
                  }
                : {
                    backgroundImage: 'linear-gradient(to bottom, #404040 0%, #000000 100%)',
                    borderBottomColor: '#333333',
                    color: headerTextColor,
                    transition: 'all 0.3s ease-in-out',
                  }
          }
        >
          <div className="flex items-center">
            {profilePicture && (
              <img
                src={profilePicture}
                alt="Profile preview"
                className="w-10 h-10 rounded-full object-cover border-2 "
                style={
                  brandColorForHeader
                    ? {
                        borderColor: `${brandColor}dd`,
                        transition: 'border-color 0.3s ease-in-out',
                      }
                    : appearance === 'light'
                      ? {
                          borderColor: '#ebebeb',
                          transition: 'border-color 0.3s ease-in-out',
                        }
                      : {
                          borderColor: '#404040',
                          transition: 'border-color 0.3s ease-in-out',
                        }
                }
              />
            )}
            <p
              className="text-sm font-medium transition-all duration-300 ease-in-out"
              style={{ marginLeft: profilePicture ? '0.5rem' : '0' }}
            >
              {name}
            </p>
          </div>
          <Ellipsis height={17} width={17} color={headerTextColor} />
        </div>

        <div className="p-4 space-y-4">
          <div className="flex justify-start">
            <div className="max-w-[85%]">
              <div
                className="px-4 py-3 rounded-tl-3xl rounded-tr-3xl rounded-br-3xl rounded-bl-none"
                style={{
                  backgroundColor: appearance === 'light' ? '#f3f4f6' : '#1f1f1f',
                  color: appearance === 'light' ? '#000000' : '#ffffff',
                }}
              >
                {name && (
                  <div className="flex items-center mb-2">
                    {profilePicture && (
                      <img
                        src={profilePicture}
                        alt="Agent"
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    )}
                    <p
                      className=" text-sm font-medium transition-all duration-300 ease-in-out"
                      style={{ marginLeft: profilePicture ? '0.5rem' : '0' }}
                    >
                      {name}
                    </p>
                  </div>
                )}

                <p className="text-sm">Hey, How can i help you today ?</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <div className="max-w-[85%]">
              <div
                className="px-4 py-3 rounded-3xl"
                style={{
                  backgroundColor: brandColor,
                  color: textColorForBrandColor,
                }}
              >
                <p className="text-sm">Thank you for your help!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
