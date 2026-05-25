import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, CheckIcon, Select } from '@mantine/core'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { showNotification } from '@/utils/notifications'
import { Tick } from '@/components/common/Tick'
import type { ModelGroup } from '@/store/slices/modelsSlice'
import type { ChatModel } from '@/types/chatbot'
import claudeIcon from '@/assets/icons/claude.svg'
import deepseekIcon from '@/assets/icons/deepseek.svg'
import geminiIcon from '@/assets/icons/gemini.svg'
import metaIcon from '@/assets/icons/meta.svg'
import openaiIcon from '@/assets/icons/openai.svg'
import { AnimatedQuestion } from './AnimatedQuestion'
import { AnsweredQuestion } from './AnsweredQuestion'
import { PromptView } from './PromptView'
import { TUNE_QUESTIONS, buildPrompt, type TuneAnswer } from './constants'

type Stage = 'asking' | 'generating' | 'done'

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
  models: ChatModel[]
  groupedModels: ModelGroup[]
  isLoadingModels: boolean
  modelLabel: string
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
  models,
  groupedModels,
  isLoadingModels,
  modelLabel,
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

  const formScrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const stepIndex = answers.length
  const currentQ =
    stepIndex < TUNE_QUESTIONS.length
      ? TUNE_QUESTIONS[stepIndex]
      : {
          q: 'Anything else worth telling your agent?',
          placeholder:
            'Add another constraint, capability, example, or context detail — or skip to finalize.',
        }

  // Autosize the textarea to its content within bounds.
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(200, Math.max(80, el.scrollHeight))}px`
  }, [draft])

  // While asking, glide to the bottom so the latest answer + next question stay
  // in view. On the transition to generating/done, glide back to the top to
  // reveal the completion screen.
  useEffect(() => {
    const el = formScrollRef.current
    if (!el) return
    const id = requestAnimationFrame(() => {
      if (stage === 'asking') smoothScrollTo(el, el.scrollHeight, 750)
      else smoothScrollTo(el, 0, 600)
    })
    return () => cancelAnimationFrame(id)
  }, [answers.length, stage])

  function submit() {
    const val = draft.trim()
    if (!val) return
    if (editingIdx !== null) {
      setAnswers(prev => prev.map((row, i) => (i === editingIdx ? { ...row, a: val } : row)))
      setEditingIdx(null)
      setDraft('')
      showNotification('success', 'Answer updated')
      return
    }
    const next = [...answers, { q: currentQ.q, a: val }]
    setAnswers(next)
    setDraft('')
    if (next.length >= TUNE_QUESTIONS.length) {
      setStage('generating')
      setPrompt(buildPrompt(next, modelLabel).join('\n'))
      setTimeout(() => setStage('done'), 1800)
    }
  }

  function skipQuestion() {
    setAnswers(prev => [...prev, { q: currentQ.q, a: '(skipped)' }])
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
    showNotification('success', 'Removed')
  }

  function resetAll() {
    setAnswers([])
    setDraft('')
    setExpandedIdx(null)
    setEditingIdx(null)
    setPrompt('')
    setStage('asking')
  }

  function continueToPlayground() {
    if (chatbotId) navigate(`/chatbot/${chatbotId}/playground`)
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      {stage === 'generating' ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[18px] p-8 text-center">
          <Tick />
          <h2 className="tune-fade-up m-0 text-[22px] font-semibold tracking-[-0.02em] text-text [animation-delay:0.2s]">
            Generating your agent prompt
          </h2>
          <p className="tune-fade-up m-0 max-w-[38ch] text-[13.5px] leading-[1.55] text-text-weak [animation-delay:0.32s]">
            Compiling answers into a tuned system prompt for {modelLabel}
            <span className="tune-dots" />
          </p>
        </div>
      ) : (
        <div
          ref={formScrollRef}
          className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto px-8 pb-6 pt-10 lg:px-15"
        >
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

          {stage === 'asking' && (
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
          )}

          {stage === 'done' ? (
            <PromptView
              prompt={prompt}
              onPromptChange={setPrompt}
              onReset={resetAll}
              onContinue={continueToPlayground}
            />
          ) : (
            <div className="flex flex-col gap-2.5">
              {answers.length === 0 ? (
                <div className="flex flex-col gap-2 py-[18px] text-left text-text-weak">
                  <p className="m-0 max-w-[46ch] text-[12.5px] leading-normal">
                    Answer the questions below about your product and what you're trying to achieve
                    with this agent. Once you've answered them all, we'll generate a tailored agent
                    tuning prompt for you.
                  </p>
                </div>
              ) : (
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
      )}

      {stage === 'asking' && (
        <div className="tune-composer-frame mx-[18px] mb-[18px] mt-3 shrink-0 rounded-xl">
          <div className="flex flex-col gap-2.5 rounded-xl px-8 pb-4 pt-3.5 lg:px-11">
            <AnimatedQuestion text={currentQ.q} />
            <textarea
              ref={textareaRef}
              dir="ltr"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={handleKey}
              placeholder={editingIdx !== null ? 'Editing answer…' : currentQ.placeholder}
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
                  rightSection={<ChevronRight size={14} />}
                >
                  Skip
                </Button>
              )}
              <Button
                onClick={submit}
                disabled={!draft.trim()}
                rightSection={<ArrowRight size={14} />}
              >
                {editingIdx !== null ? 'Save' : 'Submit'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
