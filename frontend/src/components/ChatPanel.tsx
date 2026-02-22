'use client'

import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '@/i18n/LanguageContext'
import { API_BASE } from '@/utils/api'
import { parseSSEStream } from '@/utils/stream'
import { de } from '@/i18n/translations/de'
import { en } from '@/i18n/translations/en'
import { fr } from '@/i18n/translations/fr'

const translations: Record<string, Record<string, unknown>> = { de, en, fr }

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatPanelProps {
  dimensionId?: string
  criterionId?: string
  assessmentContext?: Record<string, unknown>
  page?: 'dashboard' | 'assessment' | 'results'
  autoAnalyze?: boolean
}

export default function ChatPanel({
  dimensionId,
  criterionId,
  assessmentContext,
  page,
  autoAnalyze,
}: ChatPanelProps) {
  const { locale, t } = useLanguage()
  const trans = translations[locale]

  // H2: Contextual starter prompts based on page/dimension
  const getContextualPrompts = (): string[] => {
    const chatTrans = trans.chat as Record<string, unknown>
    const base = (chatTrans.starterPrompts ?? []) as string[]
    if (page === 'results' && chatTrans.resultsPrompts) {
      return chatTrans.resultsPrompts as string[]
    }
    if (page === 'dashboard' && chatTrans.dashboardPrompts) {
      return chatTrans.dashboardPrompts as string[]
    }
    if (dimensionId && chatTrans.dimensionPrompts) {
      return (chatTrans.dimensionPrompts as string[]).map((p: string) => p.replace('{dim}', dimensionId))
    }
    return base
  }
  const STARTER_PROMPTS = getContextualPrompts()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Check chat availability on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/chat/status`)
      .then(res => res.json())
      .then(data => setIsAvailable(data.available))
      .catch(() => setIsAvailable(false))
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // H1: Auto-analyze results when autoAnalyze is true
  const [hasAutoAnalyzed, setHasAutoAnalyzed] = useState(false)
  useEffect(() => {
    if (autoAnalyze && isOpen && !hasAutoAnalyzed && messages.length === 0 && assessmentContext && isAvailable) {
      setHasAutoAnalyzed(true)
      const prompt = t('chat.analyzePrompt')
      sendMessage(prompt)
    }
  }, [autoAnalyze, isOpen, hasAutoAnalyzed, isAvailable]) // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = async (content: string) => {
    if (!content.trim() || isStreaming) return

    const userMessage: Message = { role: 'user', content: content.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setIsStreaming(true)

    // Add empty assistant message for streaming
    const assistantMessage: Message = { role: 'assistant', content: '' }
    setMessages([...newMessages, assistantMessage])

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          dimension_id: dimensionId || null,
          criterion_id: criterionId || null,
          assessment_context: assessmentContext || null,
          locale: locale,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      let fullText = ''
      for await (const chunk of parseSSEStream(response)) {
        fullText += chunk
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: fullText }
          return updated
        })
      }
    } catch (error) {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: t('chat.errorMessage'),
        }
        return updated
      })
    } finally {
      setIsStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  // Don't render if chat is not available
  if (isAvailable === false) return null

  return (
    <>
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-6 bg-accent-blue text-white w-14 h-14 rounded-full shadow-lg hover:bg-accent-indigo transition-all duration-300 hover:shadow-xl flex items-center justify-center z-50"
          data-chat-panel="true"
          title={t('chat.openAssistant')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 left-4 sm:left-auto sm:right-6 sm:w-[420px] h-[70vh] sm:h-[600px] glass-strong rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden" data-chat-panel="true">
          {/* Header */}
          <div className="px-5 py-4 border-b border-pastel-indigo/30 flex items-center justify-between shrink-0">
            <div>
              <h3 className="font-semibold text-gray-800 text-sm">{t('chat.title')}</h3>
              <p className="text-xs text-gray-500">
                {t('chat.ragLabel')} · {dimensionId || t('chat.allDimensions')}
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 mb-4">
                  {t('chat.emptyState')}
                </p>
                <div className="space-y-2">
                  {STARTER_PROMPTS.map(prompt => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="block w-full text-left text-sm px-4 py-2.5 bg-pastel-blue/20 rounded-xl text-accent-blue hover:bg-pastel-blue/40 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-accent-blue text-white rounded-br-md'
                      : 'bg-pastel-indigo/20 text-gray-800 rounded-bl-md'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  {msg.role === 'assistant' && isStreaming && i === messages.length - 1 && (
                    <span className="inline-block w-1.5 h-4 bg-accent-blue/60 animate-pulse ml-0.5 -mb-0.5 rounded-sm" />
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-5 py-4 border-t border-pastel-indigo/30 shrink-0">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('chat.placeholder')}
                disabled={isStreaming}
                className="flex-1 border border-pastel-indigo/40 rounded-xl px-4 py-2.5 text-sm bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-accent-blue/30 focus:border-accent-blue/50 transition-all disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isStreaming}
                className="bg-accent-blue text-white px-4 py-2.5 rounded-xl hover:bg-accent-indigo disabled:opacity-40 transition-all duration-200 shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
