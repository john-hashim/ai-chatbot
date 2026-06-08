import { Logo } from '@/components/common/logo'
import { Lottie } from '@/components/common/lottie'
import searchAnimation from '@/assets/lottie/Search.json?url'

/**
 * Shared layout for the auth pages (login / signup): centered logo header and a
 * bordered card. By default the card is a 50/50 split with the form on the left
 * and a dot-grid panel on the right. Pass `single` to render a single, centered
 * section (used by the forgot-password page).
 */
export const AuthShell: React.FC<{ children: React.ReactNode; single?: boolean }> = ({
  children,
  single = false,
}) => (
  <div className="flex flex-col min-h-screen bg-gray-50">
    <header className="px-5 py-2 flex items-center justify-center shrink-0">
      <Logo height={40} width={28} fontSize={25} logoIcon={false} />
    </header>
    <div className="lg:px-32 px-6 flex-1 pt-1 pb-15 flex justify-center">
      {single ? (
        <div className="border w-full max-w-xl border-border-week lg:mt-0 rounded-2xl flex overflow-hidden bg-white">
          <div className="w-full lg:p-16 px-8 py-10 flex items-center justify-center">
            <div className="w-full">{children}</div>
          </div>
        </div>
      ) : (
        <div className="border flex-1 border-border-week lg:mt-0 rounded-2xl flex overflow-hidden bg-white">
          <div className="lg:w-1/2 w-full border-r border-border-week lg:p-16 px-8 py-10 flex items-center justify-center">
            <div className="w-full">{children}</div>
          </div>
          <div className="w-1/2 hidden lg:flex items-center justify-center bg-[radial-gradient(circle,#ebebeb_2px,#fafafa_0)] bg-size-[30px_30px]">
            <Lottie src={searchAnimation} className="w-2/3 max-w-md" />
          </div>
        </div>
      )}
    </div>
  </div>
)
