import { Logo } from '@/components/common/logo'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  ColorPicker,
  ColorPickerEyeDropper,
  ColorPickerFormat,
  ColorPickerHue,
  ColorPickerSelection,
} from '@/components/ui/shadcn-io/color-picker'
import { ThemeSwitcher } from '@/components/ui/shadcn-io/theme-switcher'
import { ArrowLeft, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export const ChatbotBasicSetup: React.FC = () => {
  const navigate = useNavigate()

  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [selectedColor] = useState('#2563eb')

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
        <div className="border flex-1 border-border lg:mt-0 rounded-2xl flex overflow-hidden">
          <div className="lg:w-1/2 w-full h-full border-r border-border lg:p-20 px-5 py-12">
            <p className="text-3xl font-semibold text-center sm:text-left">
              Let's Build Your Chatbot
            </p>
            <p className="text-sm font-light text-center sm:text-left">
              Customize your agent's look now. Additional styling options in settings.
            </p>
            <div className="mt-10">
              <p className="text-text-weak text-sm">Chatbot Name</p>
              <Input className="mt-1" type="text" id="chatbotname" placeholder="Luna AI" />
            </div>
            <div className="h-0.5 mt-6 border-t border-gray-100"></div>
            <div className="flex justify-between items-center mt-6">
              <p className="text-text-weak text-sm">Appearance</p>
              <ThemeSwitcher defaultValue="light" onChange={setTheme} value={theme} />
            </div>
            <div className="flex justify-between items-center mt-6">
              <p className="text-text-weak text-sm">Choose your brand color</p>
              <div className="bg-background-dark-week py-2 px-3 flex items-center rounded">
                <div className="mr-2">
                  <p className="text-sm text-text-weak">{selectedColor.toUpperCase()}</p>
                </div>
                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <div
                        className="w-5 h-5 rounded-full border-2 border-white cursor-pointer"
                        style={{ backgroundColor: selectedColor }}
                      ></div>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0">
                      <ColorPicker className="max-w-sm rounded-md bg-background p-4">
                        <ColorPickerSelection className="h-32" />
                        <div className="flex items-center gap-4">
                          <ColorPickerEyeDropper />
                          <div className="grid w-full gap-1">
                            <ColorPickerHue />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <ColorPickerFormat />
                        </div>
                      </ColorPicker>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
          <div className="w-1/2 h-full hidden lg:block bg-[radial-gradient(circle,_#ebebeb_2px,_#fafafa_0)] bg-[length:30px_30px]"></div>
        </div>
      </div>
    </div>
  )
}
