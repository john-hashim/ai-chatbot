interface TuneAgentTipsProps {
  modelLabel: string
}

/**
 * Right pane — a minimal card framed by a slowly rotating AI-gradient border,
 * sitting on the host's dot-pattern background.
 */
export const TuneAgentTips: React.FC<TuneAgentTipsProps> = ({ modelLabel }) => {
  return (
    <div className="relative flex min-h-0 w-full flex-1 items-center justify-center bg-[radial-gradient(circle,#ebebeb_1.2px,transparent_0)] bg-size-[30px_30px] p-10">
      <div className="tune-ai-frame w-full max-w-[320px] rounded-[20px] bg-[#fafafa] px-8 py-9 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="inline-flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.12em] text-text-weak">
            <span className="tune-live-dot h-1.5 w-1.5 rounded-full bg-color-primary" />
            Agent Tuning
          </div>
          <h2 className="m-0 text-[18px] font-medium tracking-[-0.015em] text-text">
            Crafting your assistant
          </h2>
          <p className="m-0 max-w-[32ch] text-[12.5px] leading-[1.6] text-text-weak">
            Each answer becomes a parameter — context, tone, and rules — wired into {modelLabel}.
          </p>
        </div>
      </div>
    </div>
  )
}
