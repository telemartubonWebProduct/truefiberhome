"use client";

interface HandoffButtonProps {
  disabled?: boolean;
  waiting?: boolean;
  onClick: () => void;
}

export default function HandoffButton({ disabled = false, waiting = false, onClick }: HandoffButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || waiting}
      className="inline-flex items-center justify-center rounded-full border border-[#f4bfd0] bg-[#fff2f6] px-4 py-2 text-xs font-semibold text-[#c71b49] transition hover:bg-[#ffe4ed] disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-400"
    >
      {waiting ? "กำลังส่งคำขอ..." : "ขอเจ้าหน้าที่ดูแล"}
    </button>
  );
}
