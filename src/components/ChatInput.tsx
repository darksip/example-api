import { type KeyboardEvent, useCallback, useState } from 'react'
import { Send, Square } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => void
  onStop: () => void
  isStreaming: boolean
  disabled?: boolean
}

export function ChatInput({ onSend, onStop, isStreaming, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState('')

  const handleSend = useCallback(() => {
    if (input.trim() && !isStreaming && !disabled) {
      onSend(input)
      setInput('')
    }
  }, [input, isStreaming, disabled, onSend])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  return (
    <div className="chat-input-container">
      <textarea
        className="chat-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about books or music... (Ctrl+Enter to send)"
        disabled={isStreaming || disabled}
        rows={3}
      />
      {isStreaming ? (
        <button className="btn-icon btn-icon-danger" onClick={onStop} type="button" title="Stop">
          <Square size={20} />
        </button>
      ) : (
        <button
          className="btn-icon btn-icon-primary"
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          type="button"
          title="Send"
        >
          <Send size={20} />
        </button>
      )}
    </div>
  )
}
