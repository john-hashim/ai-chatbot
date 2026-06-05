import { Logo } from '@/components/common/logo'

/**
 * Shared layout for the auth pages (login / signup): centered logo header,
 * a 50/50 split card with the form on the left and a dot-grid panel on the right.
 */
export const AuthShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-col h-screen min-h-0">
    <header className="px-5 py-2 flex items-center justify-center shrink-0">
      <Logo height={40} width={28} fontSize={25} logoIcon={false} />
    </header>
    <div className="lg:px-32 px-6 flex-1 pt-1 pb-15 flex min-h-0">
      <div className="border flex-1 border-border-week lg:mt-0 rounded-2xl flex overflow-hidden min-h-0">
        <div className="lg:w-1/2 w-full border-r border-border-week lg:p-16 px-8 py-10 flex items-center justify-center overflow-y-auto">
          <div className="w-full">{children}</div>
        </div>
        <div className="w-1/2 hidden lg:block bg-[radial-gradient(circle,#ebebeb_2px,#fafafa_0)] bg-size-[30px_30px]" />
      </div>
    </div>
  </div>
)
