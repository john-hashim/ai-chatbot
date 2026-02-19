import { useEffect, useState, useCallback } from 'react'
import { Switch, Button, Textarea, Skeleton, Tooltip } from '@mantine/core'
import {
  Copy,
  ExternalLink,
  Check,
  InfoIcon,
  MessageSquare,
  Code,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { useStore } from '@/store'
import { embedService, type EmbedConfig } from '@/api/services/embed'
import { useApi } from '@/hooks/useApi'
import { showNotification } from '@/utils/notifications'

type EmbedType = 'widget' | 'iframe'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/'
const EMBED_BASE = API_BASE.replace('/api/', '')

export const Deploy: React.FC = () => {
  const { currentChatbot } = useStore()
  const [embedConfig, setEmbedConfig] = useState<EmbedConfig | null>(null)
  const [embedType, setEmbedType] = useState<EmbedType>('widget')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [domains, setDomains] = useState('')

  const chatbotId = currentChatbot?.id

  const { loading: fetchLoading, execute: fetchEmbedConfig } = useApi(embedService.getEmbedConfig)
  const { loading: generating, execute: createEmbedConfig } = useApi(embedService.createEmbedConfig)
  const { loading: updating, execute: updateEmbedConfig } = useApi(embedService.updateEmbedConfig)

  // Fetch existing embed config on mount
  const loadEmbedConfig = useCallback(async () => {
    if (!chatbotId) return
    try {
      const res = await fetchEmbedConfig(chatbotId)
      const config = res.data ?? null
      setEmbedConfig(config)
      setDomains(config?.allowedDomains?.join('\n') ?? '')
    } catch {
      setEmbedConfig(null)
    }
  }, [chatbotId, fetchEmbedConfig])

  useEffect(() => {
    loadEmbedConfig()
  }, [loadEmbedConfig])

  const handleGenerate = async () => {
    if (!chatbotId) return
    try {
      const res = await createEmbedConfig(chatbotId)
      setEmbedConfig(res.data ?? null)
      showNotification('success', 'Embed key generated successfully')
    } catch {
      // Error handled by axios interceptor
    }
  }

  const handleRegenerate = async () => {
    if (!chatbotId) return
    try {
      const res = await updateEmbedConfig(chatbotId, { regenerateKey: true })
      setEmbedConfig(res.data ?? null)
      showNotification('success', 'Embed key regenerated. Old key is now invalid.')
    } catch {
      // Error handled by axios interceptor
    }
  }

  const handleToggleActive = async (active: boolean) => {
    if (!chatbotId) return
    try {
      const res = await updateEmbedConfig(chatbotId, { isActive: active })
      setEmbedConfig(res.data ?? null)
      showNotification('success', active ? 'Embed activated' : 'Embed deactivated')
    } catch {
      // Error handled by axios interceptor
    }
  }

  const handleSaveDomains = async () => {
    if (!chatbotId) return
    try {
      const allowedDomains = domains
        .split('\n')
        .map(d => d.trim())
        .filter(Boolean)
      const res = await updateEmbedConfig(chatbotId, { allowedDomains })
      setEmbedConfig(res.data ?? null)
      showNotification('success', 'Domain restrictions updated')
    } catch {
      // Error handled by axios interceptor
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const getSnippet = () => {
    if (!embedConfig) return ''
    if (embedType === 'widget') {
      return `<script src="${EMBED_BASE}/embed-assets/embed.js" data-chatbot-key="${embedConfig.embedKey}"></script>`
    }
    return `<iframe src="${EMBED_BASE}/embed/${embedConfig.embedKey}" width="400" height="600" frameborder="0"></iframe>`
  }

  const directChatLink = embedConfig
    ? `${EMBED_BASE}/embed/${embedConfig.embedKey}`
    : ''

  return (
    <div className="flex justify-center items-start p-6 h-full overflow-y-auto">
      <div className="w-full max-w-[640px]">
        <div className="bg-white rounded-xl border border-border-week p-6">
          {/* Header: Title + Active toggle */}
          <div className="flex justify-between items-center pb-6 border-b border-border-week">
            <div>
              <h2 className="text-text-primary font-semibold text-lg">Deploy</h2>
              <p className="text-text-weak text-[12px] mt-1">Embed your chatbot on any website</p>
            </div>
            {!fetchLoading && embedConfig && (
              <div className="flex items-center gap-2">
                {updating && <Loader2 size={14} className="animate-spin text-text-weak" />}
                <span className="text-text-weak text-[12px]">
                  {embedConfig.isActive ? 'Active' : 'Inactive'}
                </span>
                <Switch
                  styles={{ track: { cursor: 'pointer' } }}
                  checked={embedConfig.isActive}
                  onChange={e => handleToggleActive(e.currentTarget.checked)}
                  color="teal"
                  disabled={updating}
                />
              </div>
            )}
            {fetchLoading && <Skeleton height={24} width={80} radius="xl" />}
          </div>

          {/* Skeleton loading state */}
          {fetchLoading && (
            <div className="py-6">
              <Skeleton height={14} width={100} mb={12} />
              <Skeleton height={18} width={160} mb={24} />
              <Skeleton height={14} width={80} mb={12} />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton height={100} radius="lg" />
                <Skeleton height={100} radius="lg" />
              </div>
              <div className="mt-6">
                <Skeleton height={14} width={70} mb={12} />
                <Skeleton height={80} radius="md" />
              </div>
              <div className="mt-6">
                <Skeleton height={14} width={110} mb={12} />
                <Skeleton height={44} radius="md" />
              </div>
            </div>
          )}

          {/* No embed config — Generate state */}
          {!fetchLoading && !embedConfig && (
            <div className="py-12 text-center">
              <p className="text-text-secondary font-medium text-sm mb-2">
                No embed key generated yet
              </p>
              <p className="text-text-weak text-[12px] mb-6">
                Generate an embed key to get started with deploying your chatbot
              </p>
              <Button
                variant="secondary"
                onClick={handleGenerate}
                loading={generating}
                color="dark"
              >
                Generate Embed Key
              </Button>
            </div>
          )}

          {/* Embed config exists — show all options */}
          {!fetchLoading && embedConfig && (
            <>
              {/* Widget Name */}
              <div className="py-6 border-b border-border-week">
                <p className="text-text-secondary font-medium text-sm">Widget Name</p>
                <p className="text-text-primary text-sm mt-1">
                  {currentChatbot?.name ?? 'Untitled'}
                </p>
              </div>

              {/* Embed Type Toggle */}
              <div className="py-6 border-b border-border-week">
                <p className="text-text-secondary font-medium text-sm mb-3">Embed Type</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setEmbedType('widget')}
                    className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer bg-transparent ${
                      embedType === 'widget'
                        ? 'border-border-strong bg-background-dark-week'
                        : 'border-border-week hover:border-border-strong'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare
                        size={18}
                        className={embedType === 'widget' ? 'text-text-primary' : 'text-text-weak'}
                      />
                      <span
                        className={`font-medium text-sm ${
                          embedType === 'widget' ? 'text-text-primary' : 'text-text-secondary'
                        }`}
                      >
                        Chat Widget
                      </span>
                    </div>
                    <p className="text-text-weak text-[11px] leading-relaxed">
                      Embed a chat bubble on your website. Allows you to use all the advanced
                      features of the agent.
                    </p>
                  </button>
                  <button
                    onClick={() => setEmbedType('iframe')}
                    className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer bg-transparent ${
                      embedType === 'iframe'
                        ? 'border-border-strong bg-background-dark-week'
                        : 'border-border-week hover:border-border-strong'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Code
                        size={18}
                        className={embedType === 'iframe' ? 'text-text-primary' : 'text-text-weak'}
                      />
                      <span
                        className={`font-medium text-sm ${
                          embedType === 'iframe' ? 'text-text-primary' : 'text-text-secondary'
                        }`}
                      >
                        Iframe
                      </span>
                    </div>
                    <p className="text-text-weak text-[11px] leading-relaxed">
                      Embed the chat interface directly using an iframe. Note: Advanced features are
                      not supported.
                    </p>
                  </button>
                </div>
              </div>

              {/* Code Snippet */}
              <div className="py-6 border-b border-border-week">
                <p className="text-text-secondary font-medium text-sm mb-3">
                  {embedType === 'widget' ? 'Script Tag' : 'Iframe Code'}
                </p>
                <div className="relative bg-background-dark-week rounded-lg p-4">
                  <pre className="text-[12px] text-text-secondary whitespace-pre-wrap break-all font-mono leading-relaxed pr-10">
                    {getSnippet()}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(getSnippet(), 'snippet')}
                    className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-background-dark-strong transition-colors cursor-pointer bg-transparent border-0"
                  >
                    {copiedField === 'snippet' ? (
                      <Check size={14} className="text-success" />
                    ) : (
                      <Copy size={14} className="text-text-weak" />
                    )}
                  </button>
                </div>
              </div>

              {/* Direct Chat Link */}
              <div className="py-6 border-b border-border-week">
                <p className="text-text-secondary font-medium text-sm mb-3">Direct Chat Link</p>
                <div className="flex items-center gap-2 bg-background-dark-week rounded-lg p-3">
                  <span className="text-[12px] text-text-secondary font-mono flex-1 truncate">
                    {directChatLink}
                  </span>
                  <button
                    onClick={() => copyToClipboard(directChatLink, 'link')}
                    className="p-1.5 rounded-md hover:bg-background-dark-strong transition-colors cursor-pointer bg-transparent border-0"
                  >
                    {copiedField === 'link' ? (
                      <Check size={14} className="text-success" />
                    ) : (
                      <Copy size={14} className="text-text-weak" />
                    )}
                  </button>
                  <a
                    href={directChatLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md hover:bg-background-dark-strong transition-colors"
                  >
                    <ExternalLink size={14} className="text-text-weak" />
                  </a>
                </div>
              </div>

              {/* Domain Restriction */}
              <div className="py-6 border-b border-border-week">
                <p className="text-text-secondary font-medium text-sm inline-flex items-center gap-1 mb-1">
                  Domain Restriction
                  <Tooltip
                    label="Only allow the widget to be embedded on specific domains. Leave empty to allow all domains."
                    multiline
                    w={260}
                  >
                    <InfoIcon className="cursor-pointer w-4 h-4 text-text-weak" />
                  </Tooltip>
                </p>
                <p className="text-text-weak text-[11px] mb-3">
                  Enter one domain per line (e.g. example.com). Subdomains are included
                  automatically.
                </p>
                <Textarea
                  value={domains}
                  onChange={e => setDomains(e.currentTarget.value)}
                  placeholder={'example.com\napp.example.com'}
                  minRows={3}
                  maxRows={6}
                  autosize
                />
                <Button
                  className="mt-3"
                  size="xs"
                  variant="secondary"
                  onClick={handleSaveDomains}
                  loading={updating}
                >
                  Save Domains
                </Button>
              </div>

              {/* Regenerate Key */}
              <div className="pt-6">
                <p className="text-text-secondary font-medium text-sm mb-1">Embed Key</p>
                <div className="flex items-center gap-2 mb-3">
                  <code className="text-[11px] text-text-weak bg-background-dark-week px-2 py-1 rounded font-mono">
                    {embedConfig.embedKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(embedConfig.embedKey, 'key')}
                    className="p-1 rounded-md hover:bg-background-dark-strong transition-colors cursor-pointer bg-transparent border-0"
                  >
                    {copiedField === 'key' ? (
                      <Check size={12} className="text-success" />
                    ) : (
                      <Copy size={12} className="text-text-weak" />
                    )}
                  </button>
                </div>
                <Button
                  variant="secondary"
                  size="xs"
                  leftSection={
                    updating ? (
                      <RefreshCw size={12} className="animate-spin" />
                    ) : (
                      <RefreshCw size={12} />
                    )
                  }
                  onClick={handleRegenerate}
                  disabled={generating}
                >
                  Regenerate Key
                </Button>
                <p className="text-text-weak text-[11px] mt-2">
                  Regenerating will invalidate the old key immediately. All existing embeds using
                  the old key will stop working.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
