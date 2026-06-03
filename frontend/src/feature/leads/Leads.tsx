export const Leads: React.FC = () => {
  return (
    <div className="flex justify-center items-start p-6 h-full overflow-y-auto">
      <div className="w-full max-w-[640px]">
        <div className="bg-white rounded-xl border border-border-week p-6">
          <h2 className="text-text-primary font-semibold text-lg">Leads</h2>
          <p className="text-text-weak text-[12px] mt-1">
            Captured leads from your chatbot will appear here.
          </p>
        </div>
      </div>
    </div>
  )
}
