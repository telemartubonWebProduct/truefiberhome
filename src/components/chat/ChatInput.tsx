"use client";

import { useCallback } from "react";
import type { KeyboardEvent } from "react";

interface ChatInputProps {
  value: string;
  disabled?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
  onSend: () => void;
}

export default function ChatInput({
  value,
  disabled = false,
  placeholder = "พิมพ์คำถามของคุณ...",
  onChange,
  onSend,
}: ChatInputProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        onSend();
      }
    },
    [onSend]
  );

  return (
    <div className="space-y-2">
      <label htmlFor="chat-input" className="sr-only">
        Chat message
      </label>
      <div className="flex items-end gap-1.5 rounded-lg border border-slate-300 bg-white p-1.5 shadow-sm sm:gap-2 sm:rounded-xl sm:p-2">
        <textarea
          id="chat-input"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          className="max-h-32 min-h-[36px] w-full resize-none border-none bg-transparent px-1.5 py-1.5 text-[13px] text-slate-900 outline-none placeholder:text-slate-500 disabled:cursor-not-allowed sm:min-h-[40px] sm:px-2 sm:py-2 sm:text-sm"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || value.trim().length === 0}
          className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[#e61c50] px-2.5 text-sm font-semibold text-white transition hover:bg-[#cc1846] disabled:cursor-not-allowed disabled:bg-slate-300 sm:h-10 sm:min-w-10 sm:px-3"
          aria-label="Send message"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-[18px] w-[18px] sm:h-5 sm:w-5">
            <path d="M2.94 2.34a.75.75 0 01.82-.17l13.5 6a.75.75 0 010 1.38l-13.5 6A.75.75 0 012.7 14.8L3.96 10 2.7 5.2a.75.75 0 01.24-.76zm1.56 3.9l.93 3.53h5.82a.75.75 0 010 1.5H5.43l-.93 3.53L15.2 9.5 4.5 6.24z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
