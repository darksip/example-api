import { useState, useCallback, type KeyboardEvent } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  onStop,
  isStreaming,
  disabled = false,
}: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSend = useCallback(() => {
    if (input.trim() && !isStreaming && !disabled) {
      onSend(input);
      setInput('');
    }
  }, [input, isStreaming, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

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
      <div className="chat-input-actions">
        {isStreaming ? (
          <button
            className="btn btn-danger"
            onClick={onStop}
            type="button"
          >
            Stop
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={!input.trim() || disabled}
            type="button"
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
}
