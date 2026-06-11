import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge, Button, CheckIcon, HoverCard, Select, Tooltip } from '@mantine/core'
import { ArrowRight, ChevronRight, Info, Target } from 'lucide-react'
import { Tick } from '@/components/common/Tick'
import type { ModelGroup } from '@/store/slices/modelsSlice'
import type { ChatModel } from '@/types/chatbot'
import claudeIcon from '@/assets/icons/claude.svg'
import deepseekIcon from '@/assets/icons/deepseek.svg'
import geminiIcon from '@/assets/icons/gemini.svg'
import metaIcon from '@/assets/icons/meta.svg'
import openaiIcon from '@/assets/icons/openai.svg'
import {
  INSTRUCTION_OPTIONS,
  getInstructionByType,
  type InstructionType,
} from '@/constants/instructions'
import { tuneAgentService } from '@/api/services/tuneAgent'
import { AnimatedQuestion } from './AnimatedQuestion'
import { AnsweredQuestion } from './AnsweredQuestion'
import { EditPromptDrawer } from './EditPromptDrawer'
import {
  FIRST_TUNE_QUESTION,
  MAX_TUNE_QUESTIONS,
  TUNE_QUESTIONS,
  buildPrompt,
  type TuneAnswer,
  type TuneQuestion,
} from './constants'

type Stage = 'asking' | 'generating' | 'done'

const instructionSelectData = INSTRUCTION_OPTIONS.map(opt => ({
  value: opt.value,
  label: opt.label,
}))

const VENDOR_ICONS: Record<string, string> = {
  Anthropic: claudeIcon,
  DeepSeek: deepseekIcon,
  Google: geminiIcon,
  Meta: metaIcon,
  OpenAI: openaiIcon,
}

const ModelIcon: React.FC<{ src?: string; alt: string }> = ({ src, alt }) =>
  src ? <img src={src} alt={alt} className="h-4 w-4 object-contain" /> : null

interface TuneAgentFormProps {
  model: string | null
  onModelChange: (id: string | null) => void
  instructionType: InstructionType
  onInstructionTypeChange: (type: InstructionType) => void
  savedCustomInstruction: string | null
  onCustomInstructionChange: (prompt: string | null) => void
  models: ChatModel[]
  groupedModels: ModelGroup[]
  isLoadingModels: boolean
  modelLabel: string
  continueLabel?: string
  onContinue?: () => void
  hideContinue?: boolean
  hideHeader?: boolean
  compact?: boolean
}

// easeInOutCubic — buttery custom scroll instead of an abrupt jump
function smoothScrollTo(el: HTMLElement, target: number, duration = 700) {
  const start = el.scrollTop
  const change = target - start
  if (Math.abs(change) < 2) return
  const startTime = performance.now()
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
  function step(now: number) {
    const t = Math.min(1, (now - startTime) / duration)
    el.scrollTop = start + change * ease(t)
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

export const TuneAgentForm: React.FC<TuneAgentFormProps> = ({
  model,
  onModelChange,
  instructionType,
  onInstructionTypeChange,
  savedCustomInstruction,
  onCustomInstructionChange,
  models,
  groupedModels,
  isLoadingModels,
  modelLabel,
  continueLabel,
  onContinue,
  hideContinue,
  hideHeader,
  compact,
}) => {
  const navigate = useNavigate()
  const { chatbotId } = useParams()

  const iconForModelId = useMemo(() => {
    const vendorById = new Map(models.map(m => [m.id, m.vendor]))
    return (id: string | null | undefined) => {
      const vendor = id ? vendorById.get(id) : undefined
      return vendor ? VENDOR_ICONS[vendor] : undefined
    }
  }, [models])

  const [answers, setAnswers] = useState<TuneAnswer[]>([])
  const [draft, setDraft] = useState('')
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [stage, setStage] = useState<Stage>('asking')
  const [prompt, setPrompt] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  // The interview is AI-driven: questions come from the backend one at a time,
  // each tailored to the answers so far. The first question is fixed.
  const [currentQ, setCurrentQ] = useState<TuneQuestion>(FIRST_TUNE_QUESTION)
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false)

  const selectedInstruction = getInstructionByType(instructionType)
  const isManual = instructionType === 'manual'

  // The prompt box is shown for every preset, and for the custom flow once the
  // generated prompt is ready. While the custom flow is still gathering answers
  // we show the question flow instead.
  const showPrompt = !isManual || stage === 'done'
  const promptText = isManual ? prompt : (selectedInstruction?.instruction ?? '')

  const formScrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  // Tracks the saved prompt we last seeded the box from, and the current stage,
  // so the seeding effect can fire on genuine prop changes without re-running
  // every time `stage` changes (which would clobber a "Start Over" reset before
  // the async save of customInstruction=null propagates back as the prop).
  const seededRef = useRef<string | null>(null)
  const stageRef = useRef<Stage>(stage)
  stageRef.current = stage
  // Bumped on reset / instruction-type switch so an in-flight question or
  // instruction request from the old flow can't clobber the fresh state.
  const flowIdRef = useRef(0)

  // While in manual mode, show the saved custom prompt if one exists. Switching
  // to a preset clears only the local question-flow UI — the saved prompt is
  // preserved on the chatbot so returning to "Custom" restores it. Skip seeding
  // while the "generating" animation is running so a fast API resolve doesn't
  // pre-empt the spinner.
  useEffect(() => {
    if (instructionType !== 'manual') {
      flowIdRef.current += 1
      setAnswers([])
      setDraft('')
      setExpandedIdx(null)
      setEditingIdx(null)
      setPrompt('')
      setStage('asking')
      setCurrentQ(FIRST_TUNE_QUESTION)
      setIsLoadingQuestion(false)
      seededRef.current = null
      return
    }
    if (stageRef.current === 'generating') return
    // Only seed when the saved prompt genuinely changes — not on every `stage`
    // transition. This lets "Start Over" reset to the question flow without the
    // effect re-seeding from a stale, not-yet-cleared `savedCustomInstruction`.
    if (savedCustomInstruction && savedCustomInstruction !== seededRef.current) {
      seededRef.current = savedCustomInstruction
      setPrompt(savedCustomInstruction)
      setStage('done')
    }
  }, [instructionType, savedCustomInstruction])

  // Autosize the textarea to its content within bounds.
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(200, Math.max(80, el.scrollHeight))}px`
  }, [draft])

  // While asking, glide to the bottom so the latest answer + next question stay
  // in view. On the transition to generating/done, glide back to the top to
  // reveal the completion screen. We never scroll on load: with no answers yet
  // there's nothing to scroll to, and a seeded "done" stage is already at top.
  useEffect(() => {
    const el = formScrollRef.current
    if (!el) return
    if (stage === 'asking' && answers.length === 0) return
    const id = requestAnimationFrame(() => {
      if (stage === 'asking') smoothScrollTo(el, el.scrollHeight, 750)
      else smoothScrollTo(el, 0, 600)
    })
    return () => cancelAnimationFrame(id)
  }, [answers.length, stage])

  /**
   * Ask the backend agent for the next interview question. Falls back to the
   * seeded question list (and finally straight to generation) if the API
   * fails, so the flow never blocks.
   */
  async function advance(next: TuneAnswer[]) {
    const flowId = flowIdRef.current
    if (next.length >= MAX_TUNE_QUESTIONS) return finalize(next)
    if (!chatbotId) return advanceWithFallback(next)
    setIsLoadingQuestion(true)
    try {
      const { data } = await tuneAgentService.nextQuestion(chatbotId, next)
      if (flowIdRef.current !== flowId) return
      const result = data.data
      if (!result || result.done) return finalize(next)
      setCurrentQ({ q: result.question, placeholder: result.placeholder })
    } catch {
      if (flowIdRef.current !== flowId) return
      advanceWithFallback(next)
    } finally {
      if (flowIdRef.current === flowId) setIsLoadingQuestion(false)
    }
  }

  function advanceWithFallback(next: TuneAnswer[]) {
    const fallback = TUNE_QUESTIONS[next.length]
    if (!fallback) {
      void finalize(next)
      return
    }
    setCurrentQ(fallback)
  }

  /**
   * Compile the interview into the custom instruction via the backend agent.
   * If that fails, assemble a local prompt from the answers so the user still
   * gets a usable instruction.
   */
  async function finalize(allAnswers: TuneAnswer[]) {
    const flowId = flowIdRef.current
    setStage('generating')
    let generated: string | null = null
    if (chatbotId && allAnswers.length > 0) {
      try {
        const { data } = await tuneAgentService.generateInstruction(chatbotId, allAnswers)
        generated = data.data?.instruction ?? null
      } catch {
        generated = null
      }
    }
    if (flowIdRef.current !== flowId) return
    if (!generated) {
      // Local fallback: base instruction plus the user's tailored sections.
      const base = getInstructionByType('base')?.instruction ?? ''
      const custom = buildPrompt(allAnswers, modelLabel).join('\n')
      generated = [base, '', custom].join('\n')
    }
    setPrompt(generated)
    onCustomInstructionChange(generated)
    setStage('done')
  }

  function submit() {
    const val = draft.trim()
    if (!val || isLoadingQuestion) return
    if (editingIdx !== null) {
      setAnswers(prev => prev.map((row, i) => (i === editingIdx ? { ...row, a: val } : row)))
      setEditingIdx(null)
      setDraft('')
      return
    }
    const next = [...answers, { q: currentQ.q, a: val }]
    setAnswers(next)
    setDraft('')
    void advance(next)
  }

  function skipQuestion() {
    if (isLoadingQuestion) return
    const next = [...answers, { q: currentQ.q, a: '(skipped)' }]
    setAnswers(next)
    void advance(next)
  }

  function startEdit(idx: number) {
    setEditingIdx(idx)
    setDraft(answers[idx].a)
    setExpandedIdx(idx)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  function deleteRow(idx: number) {
    setAnswers(prev => prev.filter((_, i) => i !== idx))
    if (editingIdx === idx) {
      setEditingIdx(null)
      setDraft('')
    }
  }

  function resetAll() {
    flowIdRef.current += 1
    setAnswers([])
    setDraft('')
    setExpandedIdx(null)
    setEditingIdx(null)
    setPrompt('')
    setStage('asking')
    setCurrentQ(FIRST_TUNE_QUESTION)
    setIsLoadingQuestion(false)
    // Mark the current saved value as already-seeded so the seeding effect won't
    // re-seed the box before the async customInstruction=null save propagates.
    seededRef.current = savedCustomInstruction
    // Clear the saved custom prompt on the chatbot.
    onCustomInstructionChange(null)
  }

  function continueToPlayground() {
    if (chatbotId) navigate(`/chatbot/${chatbotId}/playground`)
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter submits the answer; Shift+Enter inserts a newline.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <div
        ref={formScrollRef}
        className={`flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto pb-6 pt-10 ${
          compact ? 'px-6' : 'px-8 lg:px-15'
        }`}
      >
        {!hideHeader && (
          <div className="flex flex-col gap-1.5">
            <h1 className="m-0 text-[28px] font-semibold tracking-[-0.02em] text-text">
              Tune Your Agent
            </h1>
            <p className="m-0 max-w-[56ch] text-[13px] font-light leading-[1.55] text-text-weak">
              Shape how your agent talks, thinks, and responds. These settings define your agent's
              personality and behavior across every conversation. You can refine them anytime from
              settings.
            </p>
          </div>
        )}

        {/* 1. Model */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[12.5px] font-medium text-text-secondary">
            Select your AI model
          </label>
          <Select
            data={groupedModels}
            value={model}
            onChange={onModelChange}
            allowDeselect={false}
            checkIconPosition="right"
            placeholder={isLoadingModels ? 'Loading models...' : 'Select a model'}
            disabled={groupedModels.length === 0}
            leftSection={
              iconForModelId(model) ? <ModelIcon src={iconForModelId(model)} alt="" /> : undefined
            }
            renderOption={({ option, checked }) => (
              <div className="flex w-full items-center gap-2">
                <ModelIcon src={iconForModelId(option.value)} alt="" />
                <span className="flex-1 truncate">{option.label}</span>
                {checked && <CheckIcon size={12} />}
              </div>
            )}
          />
        </div>

        {/* 2. Instruction type */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <label className="text-[12.5px] font-medium text-text-secondary">
              System Instruction
            </label>
            <HoverCard
              width={320}
              shadow="md"
              radius="md"
              position="top"
              withArrow
              arrowSize={10}
              openDelay={80}
              closeDelay={80}
              transitionProps={{ transition: 'pop', duration: 150 }}
            >
              <HoverCard.Target>
                <span className="inline-flex h-[18px] w-[18px] shrink-0 cursor-help items-center justify-center rounded-full text-text-weak transition-colors hover:bg-icon-bg-hover hover:text-icon-hover">
                  <Info size={13} strokeWidth={2} />
                </span>
              </HoverCard.Target>
              <HoverCard.Dropdown className="p-3.5!">
                <div className="flex flex-col gap-2.5 text-[12px] leading-[1.55] text-text-secondary">
                  <p className="m-0">
                    If you only need a knowledge-base reply bot, use the{' '}
                    <span className="font-medium text-text">Base</span> or{' '}
                    <span className="font-medium text-text">General AI Agent</span> instruction.
                  </p>
                  <p className="m-0">
                    If you want the agent to automatically identify, qualify, and organize important
                    leads, create a <span className="font-medium text-text">Custom</span>{' '}
                    instruction tailored to your needs. We'll take care of lead capture and
                    filtering for your next steps.
                  </p>
                </div>
              </HoverCard.Dropdown>
            </HoverCard>
          </div>
          <Select
            data={instructionSelectData}
            value={instructionType}
            onChange={val => onInstructionTypeChange((val as InstructionType) ?? 'manual')}
            allowDeselect={false}
            checkIconPosition="right"
            renderOption={({ option, checked }) => (
              <div className="flex w-full items-center gap-2">
                <span className="truncate">{option.label}</span>
                {option.value === 'manual' && (
                  <Badge size="xs" variant="light" radius="sm">
                    Recommended
                  </Badge>
                )}
                <span className="flex-1" />
                {checked && <CheckIcon size={12} />}
              </div>
            )}
          />
          {selectedInstruction && (
            <p className="m-0 text-[12px] leading-normal text-text-weak">
              {selectedInstruction.description}
            </p>
          )}
          {/* Why custom matters — lead capture only works with a tailored instruction. */}
          <div className="mt-1 flex items-start gap-2.5 rounded-lg border border-border-week bg-background-dark-week px-3.5 py-3">
            <Target size={15} strokeWidth={2} className="mt-0.5 shrink-0 text-text-secondary" />
            <p className="m-0 text-[12px] leading-[1.55] text-text-secondary">
              <span className="font-medium text-text">
                Custom instruction is how your agent captures leads.
              </span>{' '}
              Presets only answer questions. A generated custom instruction teaches your agent to
              ask the right qualifying questions for your business and sort every lead into your
              pipeline — so high-priority leads never slip through.
            </p>
          </div>
        </div>

        {/* 3. Prompt box (presets + generated custom prompt) / question flow */}
        {showPrompt ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[12.5px] font-medium text-text-secondary">Agent Prompt</label>
              {/* 6. Edit + Reset only for the custom flow */}
              {isManual && (
                <div className="flex items-center gap-2">
                  <Tooltip label="Open editor to refine the full prompt" withArrow openDelay={300}>
                    <Button
                      variant="light"
                      size="compact-xs"
                      radius="md"
                      onClick={() => setEditOpen(true)}
                      styles={{
                        root: {
                          height: 27,
                          paddingInline: 14,
                          fontSize: 11.5,
                          fontWeight: 500,
                          letterSpacing: '-0.005em',
                        },
                      }}
                    >
                      Edit Prompt
                    </Button>
                  </Tooltip>

                  <Tooltip
                    label="Discard and start the question flow over"
                    withArrow
                    openDelay={300}
                  >
                    <Button
                      variant="subtle"
                      color="gray"
                      size="compact-xs"
                      radius="md"
                      onClick={resetAll}
                      styles={{
                        root: {
                          height: 27,
                          paddingInline: 14,
                          fontSize: 11.5,
                          fontWeight: 500,
                          letterSpacing: '-0.005em',
                        },
                      }}
                    >
                      Start Over
                    </Button>
                  </Tooltip>
                </div>
              )}
            </div>
            <div className="max-h-[60vh] overflow-auto rounded-lg border border-border-week bg-background-dark-week p-3">
              <pre className="m-0 whitespace-pre-wrap text-[12px] leading-relaxed text-text-secondary">
                {promptText}
              </pre>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <p className="m-0 flex items-center gap-1.5 text-left text-[12.5px] leading-normal text-text-weak">
              We'll help you generate a custom prompt — you can edit it later. Answer the questions
              below.
              <HoverCard
                width={320}
                shadow="md"
                radius="md"
                position="top"
                withArrow
                arrowSize={10}
                openDelay={80}
                closeDelay={80}
                transitionProps={{ transition: 'pop', duration: 150 }}
              >
                <HoverCard.Target>
                  <span className="inline-flex h-[18px] w-[18px] shrink-0 cursor-help items-center justify-center rounded-full text-text-weak transition-colors hover:bg-icon-bg-hover hover:text-icon-hover">
                    <Info size={13} strokeWidth={2} />
                  </span>
                </HoverCard.Target>
                <HoverCard.Dropdown className="p-3.5!">
                  <p className="m-0 text-[12px] leading-[1.55] text-text-secondary">
                    Share details about your product and goals for this agent. Based on your
                    answers, we'll create a customized agent tuning prompt tailored to your
                    workflow.
                  </p>
                </HoverCard.Dropdown>
              </HoverCard>
            </p>
            {answers.length > 0 && (
              <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-weak">
                Answered questions
              </div>
            )}
            {answers.map((row, i) => (
              <AnsweredQuestion
                key={i}
                q={row.q}
                a={row.a}
                expanded={expandedIdx === i}
                onToggle={() => setExpandedIdx(x => (x === i ? null : i))}
                onEdit={() => startEdit(i)}
                onDelete={() => deleteRow(i)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer: the question composer while gathering custom answers, otherwise
          the Continue button (shown for every other state). */}
      {isManual && (stage === 'asking' || stage === 'generating') ? (
        <div
          className={`tune-composer-frame mb-[18px] mt-3 shrink-0 rounded-xl ${
            compact ? 'mx-6' : 'mx-[18px]'
          }`}
        >
          {stage === 'generating' ? (
            <div
              className={`flex flex-col items-center gap-3 rounded-xl py-7 text-center ${
                compact ? 'px-6' : 'px-8 lg:px-11'
              }`}
            >
              <Tick />
              <p className="m-0 text-[15px] font-semibold tracking-[-0.01em] text-text">
                Generating your agent prompt
                <span className="tune-dots" />
              </p>
              <p className="m-0 max-w-[38ch] text-[12.5px] leading-normal text-text-weak">
                Compiling answers into a tuned system prompt for {modelLabel}
              </p>
            </div>
          ) : (
            <div
              className={`flex flex-col gap-2.5 rounded-xl pb-4 pt-3.5 ${
                compact ? 'px-6' : 'px-8 lg:px-11'
              }`}
            >
              {isLoadingQuestion ? (
                <p className="m-0 py-1 text-[13.5px] font-medium tracking-[-0.005em] text-text">
                  Preparing your next question
                  <span className="tune-dots" />
                </p>
              ) : (
                <AnimatedQuestion text={currentQ.q} />
              )}
              <textarea
                ref={textareaRef}
                dir="ltr"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={handleKey}
                disabled={isLoadingQuestion}
                placeholder={
                  // Hide the previous question's example while the next one loads.
                  isLoadingQuestion
                    ? '...'
                    : editingIdx !== null
                      ? 'Editing answer…'
                      : currentQ.placeholder
                }
                className="max-h-[200px] min-h-20 w-full resize-none border-0 bg-transparent py-2 text-left text-sm leading-[1.6] text-text outline-none placeholder:font-normal placeholder:text-text-weak/70"
              />
              <div className="flex items-center justify-end gap-2">
                {editingIdx !== null ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditingIdx(null)
                      setDraft('')
                    }}
                  >
                    Cancel
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={skipQuestion}
                    disabled={isLoadingQuestion}
                    rightSection={<ChevronRight size={14} />}
                  >
                    Skip
                  </Button>
                )}
                <Button
                  onClick={submit}
                  disabled={!draft.trim() || isLoadingQuestion}
                  rightSection={<ArrowRight size={14} />}
                >
                  {editingIdx !== null ? 'Save' : 'Submit'}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : hideContinue ? null : (
        // 4. Continue button — shown for every preset and the completed custom flow.
        <div
          className={`flex shrink-0 justify-end pb-[18px] pt-3 ${
            compact ? 'px-6' : 'px-8 lg:px-15'
          }`}
        >
          <Button
            onClick={onContinue ?? continueToPlayground}
            rightSection={<ArrowRight size={14} />}
          >
            {continueLabel ?? 'Continue to Agent Playground'}
          </Button>
        </div>
      )}
      <EditPromptDrawer
        opened={editOpen}
        initialPrompt={promptText}
        onClose={() => setEditOpen(false)}
        onSave={next => {
          setPrompt(next)
          onCustomInstructionChange(next)
        }}
      />
    </div>
  )
}
