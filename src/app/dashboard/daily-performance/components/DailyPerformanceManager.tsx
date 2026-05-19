"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { monthKeyToThaiLabel } from "@/src/lib/daily-performance";

type DailyPerformanceRow = {
  id: string;
  recordDate: string;
  lineLeads: number;
  phoneLeads: number;
  facebookLeads: number;
  salesSuccess: number;
  installSuccess: number;
  pendingInstall: number;
  installFailed: number;
  waitingDocuments: number;
  notes: string | null;
};

type DailyPerformanceSummary = {
  totalLineLeads: number;
  totalPhoneLeads: number;
  totalFacebookLeads: number;
  totalLeads: number;
  totalSalesSuccess: number;
  totalInstallSuccess: number;
  totalPendingInstall: number;
  totalInstallFailed: number;
  totalWaitingDocuments: number;
};

type DailyPerformanceManagerProps = {
  initialMonth: string;
  initialRows: DailyPerformanceRow[];
  initialSummary: DailyPerformanceSummary;
  todayDate: string;
};

type FormState = {
  recordDate: string;
  lineLeads: string;
  phoneLeads: string;
  facebookLeads: string;
  salesSuccess: string;
  installSuccess: string;
  pendingInstall: string;
  installFailed: string;
  waitingDocuments: string;
  notes: string;
};

const numberFormatter = new Intl.NumberFormat("th-TH");

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatDateLabel(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function toDateInput(value: string) {
  return value.slice(0, 10);
}

function toMetric(value: string) {
  if (!value.trim()) {
    return 0;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.trunc(parsed));
}

function displayMetric(value: number) {
  return value > 0 ? formatNumber(value) : "-";
}

function createEmptyForm(todayDate: string): FormState {
  return {
    recordDate: todayDate,
    lineLeads: "",
    phoneLeads: "",
    facebookLeads: "",
    salesSuccess: "",
    installSuccess: "",
    pendingInstall: "",
    installFailed: "",
    waitingDocuments: "",
    notes: "",
  };
}

export default function DailyPerformanceManager({
  initialMonth,
  initialRows,
  initialSummary,
  todayDate,
}: DailyPerformanceManagerProps) {
  const router = useRouter();
  const [month, setMonth] = useState(initialMonth);
  const [rows, setRows] = useState<DailyPerformanceRow[]>(initialRows);
  const [summary, setSummary] = useState(initialSummary);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(createEmptyForm(todayDate));
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

    // const handleHandoff = useCallback(async () => {
    //   if (!sessionId || !visitorId || isRequestingHuman) {
    //     return;
    //   }
    //   setWaiting(true);
    //   setIsRequestingHuman(true);
    //   setError(null);
  
    //   try {
    //     const response = await fetch("/api/chat/handoff", {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //         "x-chat-visitor-id": visitorId,
    //       },
    //       body: JSON.stringify({
    //         sessionId,
    //       }),
    //     });
    //     await fetch("/api/notify", {
    //       method: "POST",
    //       headers: { "Content-Type": "application/json" },
    //       body: JSON.stringify({
    //         message: [
    //           "🔔 มีลูกค้าขอเจ้าหน้าที่ดูแล!",
    //           `🕐 เวลา: ${new Date().toLocaleString("th-TH")}`,
    //           "กรุณาตรวจสอบและติดต่อกลับลูกค้าโดยเร็วที่สุดด้วยครับ!",
    //           "www.truefiberhome.com/dashboard/chat",
    //         ].join("\n"),
    //       }),
    //     });
       
    //     if (isRecoverableSessionStatus(response.status)) {
    //       await createSession(visitorId);
    //       setError("แชทเดิมหมดอายุแล้ว ระบบเริ่มห้องใหม่ให้แล้ว");
    //       return;
    //     }
  
    //     if (!response.ok) {
    //       throw new Error(`Handoff request failed: ${response.status}`);
    //     }
  
    //     const loadedSession = await loadSession(sessionId, visitorId);
    //     if (!loadedSession) {
    //       await createSession(visitorId);
    //       setError("แชทเดิมหมดอายุแล้ว ระบบเริ่มห้องใหม่ให้แล้ว");
    //     }
    //   } catch (handoffError) {
    //     console.error("Failed to request human handoff", handoffError);
    //     setError("ไม่สามารถส่งคำขอคุยกับเจ้าหน้าที่ได้");
    //   } finally {
    //     setIsRequestingHuman(false);
    //   }
    // }, [createSession, isRequestingHuman, loadSession, sessionId, visitorId]);

  useEffect(() => {
    setMonth(initialMonth);
    setRows(initialRows);
    setSummary(initialSummary);
    setEditingId(null);
    setForm(createEmptyForm(todayDate));
  }, [initialMonth, initialRows, initialSummary, todayDate]);

  const [isSendingReport, setIsSendingReport] = useState(false);
  const handleSendReport = async () => {
    try {
      setIsSendingReport(true);
      const res = await fetch("/api/corn-report-line", { method: "POST" });
      if (res.ok) {
        alert("ส่งรายงานเข้ากลุ่ม LINE สำเร็จ");
      } else {
        const body = await res.json().catch(() => null);
        const lineErr = body?.error;
        const lineMsg =
          typeof lineErr === "string"
            ? lineErr
            : lineErr?.message ||
              (Array.isArray(lineErr?.details) &&
                lineErr.details
                  .map((d: any) => `${d.property ?? ""} ${d.message ?? ""}`.trim())
                  .filter(Boolean)
                  .join("; ")) ||
              JSON.stringify(lineErr ?? body) ||
              res.statusText;
        console.error("LINE report failed:", { status: res.status, body });
        alert(`เกิดข้อผิดพลาด (${res.status}): ${lineMsg}`);
      }
    } catch (e) {
      console.error(e);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsSendingReport(false);
    }
  };

  const onlineSummary = useMemo(() => {
    const registrations =
      summary.totalInstallSuccess +
      summary.totalPendingInstall +
      summary.totalInstallFailed;

    return {
      registrations,
      pendingInstall: summary.totalPendingInstall,
      installSuccess: summary.totalInstallSuccess,
      installFailed: summary.totalInstallFailed,
      waitingDocuments: summary.totalWaitingDocuments,
    };
  }, [summary]);

  const handleMonthChange = (value: string) => {
    setMonth(value);
    setStatusMessage("");
    setErrorMessage("");
    router.push(`?month=${encodeURIComponent(value)}`);
  };

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setErrorMessage("");
    setStatusMessage("");
    setForm(createEmptyForm(todayDate));
  };

  const handleEdit = (row: DailyPerformanceRow) => {
    setEditingId(row.id);
    setStatusMessage("");
    setErrorMessage("");
    setForm({
      recordDate: toDateInput(row.recordDate),
      lineLeads: row.lineLeads > 0 ? String(row.lineLeads) : "",
      phoneLeads: row.phoneLeads > 0 ? String(row.phoneLeads) : "",
      facebookLeads: row.facebookLeads > 0 ? String(row.facebookLeads) : "",
      salesSuccess: row.salesSuccess > 0 ? String(row.salesSuccess) : "",
      installSuccess: row.installSuccess > 0 ? String(row.installSuccess) : "",
      pendingInstall: row.pendingInstall > 0 ? String(row.pendingInstall) : "",
      installFailed: row.installFailed > 0 ? String(row.installFailed) : "",
      waitingDocuments:
        row.waitingDocuments > 0 ? String(row.waitingDocuments) : "",
      notes: row.notes || "",
    });
  };

  const handleDelete = async (row: DailyPerformanceRow) => {
    const isConfirmed = window.confirm(
      `ยืนยันการลบข้อมูลวันที่ ${formatDateLabel(row.recordDate)} ?`,
    );
    if (!isConfirmed) {
      return;
    }

    setDeletingId(row.id);
    setStatusMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/daily-performance/${row.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error || "ลบข้อมูลไม่สำเร็จ");
      }

      setStatusMessage("ลบข้อมูลเรียบร้อยแล้ว");
      if (editingId === row.id) {
        setForm(createEmptyForm(todayDate));
        setEditingId(null);
      }
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "ลบข้อมูลไม่สำเร็จ";
      setErrorMessage(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setStatusMessage("");
    setErrorMessage("");

    try {
      if (!form.recordDate) {
        throw new Error("กรุณาเลือกวันที่ก่อนบันทึก");
      }

      const response = await fetch("/api/daily-performance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recordDate: form.recordDate,
          lineLeads: toMetric(form.lineLeads),
          phoneLeads: toMetric(form.phoneLeads),
          facebookLeads: toMetric(form.facebookLeads),
          salesSuccess: toMetric(form.salesSuccess),
          installSuccess: toMetric(form.installSuccess),
          pendingInstall: toMetric(form.pendingInstall),
          installFailed: toMetric(form.installFailed),
          waitingDocuments: toMetric(form.waitingDocuments),
          notes: form.notes,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error || "บันทึกข้อมูลไม่สำเร็จ");
      }

      setStatusMessage("บันทึกข้อมูลเรียบร้อยแล้ว");
      setEditingId(null);
      setForm((prev) => ({
        ...createEmptyForm(todayDate),
        recordDate: prev.recordDate,
      }));
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "บันทึกข้อมูลไม่สำเร็จ";
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-gray-500">
              Daily Input
            </p>
            <h2 className="mt-1 text-xl font-bold text-white">
              สรุปยอดประจำเดือน
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              เลือกเดือนที่ต้องการดู/บันทึกข้อมูล
            </p>
          </div>

          <div className="flex gap-4 items-end">
            <label className="flex flex-col gap-1 text-sm text-gray-300">
              เดือนรายงาน
              <input
                type="month"
                value={month}
                onChange={(event) => handleMonthChange(event.target.value)}
                className="rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-white focus:border-blue-500 focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"
              />
            </label>
            <button
              type="button"
              onClick={handleSendReport}
              disabled={isSendingReport}
              className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {isSendingReport ? "กำลังส่ง..." : "ส่งรายงาน LINE เข้ากลุ่ม"}
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-3">
            <p className="text-xs text-gray-500">ลีดรวมทุกช่องทาง</p>
            <p className="mt-1 text-2xl font-black text-white">
              {formatNumber(summary.totalLeads)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-3">
            <p className="text-xs text-gray-500">ยอดขายสำเร็จ</p>
            <p className="mt-1 text-2xl font-black text-white">
              {formatNumber(summary.totalSalesSuccess)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-3">
            <p className="text-xs text-gray-500">ติดตั้งสำเร็จ</p>
            <p className="mt-1 text-2xl font-black text-emerald-300">
              {formatNumber(summary.totalInstallSuccess)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-3">
            <p className="text-xs text-gray-500">รอติดตั้ง</p>
            <p className="mt-1 text-2xl font-black text-amber-300">
              {formatNumber(summary.totalPendingInstall)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-3">
            <p className="text-xs text-gray-500">ติดตั้งไม่ได้</p>
            <p className="mt-1 text-2xl font-black text-rose-300">
              {formatNumber(summary.totalInstallFailed)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-3">
            <p className="text-xs text-gray-500">รอส่งเอกสาร</p>
            <p className="mt-1 text-2xl font-black text-cyan-300">
              {formatNumber(summary.totalWaitingDocuments)}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5">
        <h3 className="text-lg font-bold text-white">
          รายงานยอดขายออนไลน์ ({monthKeyToThaiLabel(month)})
        </h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[760px] w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-800/60 text-xs uppercase tracking-[0.12em] text-gray-400">
                <th className="border border-gray-700 px-3 py-2 text-left">
                  เดือน
                </th>
                <th className="border border-gray-700 px-3 py-2 text-center">
                  ลงทะเบียน
                </th>
                <th className="border border-gray-700 px-3 py-2 text-center">
                  รอติดตั้ง
                </th>
                <th className="border border-gray-700 px-3 py-2 text-center">
                  ติดตั้งสำเร็จ
                </th>
                <th className="border border-gray-700 px-3 py-2 text-center">
                  ติดตั้งไม่ได้
                </th>
                <th className="border border-gray-700 px-3 py-2 text-center">
                  รอส่งเอกสาร
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-gray-950/40 text-gray-200">
                <td className="border border-gray-700 px-3 py-2 font-semibold">
                  ขายออนไลน์
                </td>
                <td className="border border-gray-700 px-3 py-2 text-center font-semibold text-yellow-200">
                  {formatNumber(onlineSummary.registrations)}
                </td>
                <td className="border border-gray-700 px-3 py-2 text-center">
                  {formatNumber(onlineSummary.pendingInstall)}
                </td>
                <td className="border border-gray-700 px-3 py-2 text-center font-semibold text-emerald-300">
                  {formatNumber(onlineSummary.installSuccess)}
                </td>
                <td className="border border-gray-700 px-3 py-2 text-center font-semibold text-rose-300">
                  {formatNumber(onlineSummary.installFailed)}
                </td>
                <td className="border border-gray-700 px-3 py-2 text-center">
                  {formatNumber(onlineSummary.waitingDocuments)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          ลงทะเบียนคำนวณจาก ติดตั้งสำเร็จ + รอติดตั้ง + ติดตั้งไม่ได้
          (ตามรูปแบบรายงานทีมขาย)
        </p>
      </section>

      <section className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5">
        <h3 className="text-lg font-bold text-white">
          ฟอร์มบันทึกข้อมูลรายวัน
        </h3>
        <p className="mt-1 text-sm text-gray-400">
          กรอกข้อมูลแล้วกดบันทึก ระบบจะอัปเดตข้อมูลของวันนั้นทันที
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <label className="flex flex-col gap-1 text-sm text-gray-300">
              วันที่
              <input
                type="date"
                value={form.recordDate}
                onChange={(event) =>
                  updateField("recordDate", event.target.value)
                }
                className="rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-white focus:border-blue-500 focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"
                required
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-300">
              ลูกค้า Line
              <input
                type="number"
                min={0}
                value={form.lineLeads}
                onChange={(event) =>
                  updateField("lineLeads", event.target.value)
                }
                placeholder="0"
                className="rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-300">
              ลูกค้าเบอร์โทร
              <input
                type="number"
                min={0}
                value={form.phoneLeads}
                onChange={(event) =>
                  updateField("phoneLeads", event.target.value)
                }
                placeholder="0"
                className="rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-300">
              ลูกค้า Facebook
              <input
                type="number"
                min={0}
                value={form.facebookLeads}
                onChange={(event) =>
                  updateField("facebookLeads", event.target.value)
                }
                placeholder="0"
                className="rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-300">
              ยอดขายสำเร็จ
              <input
                type="number"
                min={0}
                value={form.salesSuccess}
                onChange={(event) =>
                  updateField("salesSuccess", event.target.value)
                }
                placeholder="0"
                className="rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-300">
              ติดตั้งสำเร็จ
              <input
                type="number"
                min={0}
                value={form.installSuccess}
                onChange={(event) =>
                  updateField("installSuccess", event.target.value)
                }
                placeholder="0"
                className="rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-300">
              รอติดตั้ง
              <input
                type="number"
                min={0}
                value={form.pendingInstall}
                onChange={(event) =>
                  updateField("pendingInstall", event.target.value)
                }
                placeholder="0"
                className="rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-300">
              ติดตั้งไม่ได้
              <input
                type="number"
                min={0}
                value={form.installFailed}
                onChange={(event) =>
                  updateField("installFailed", event.target.value)
                }
                placeholder="0"
                className="rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-300">
              รอส่งเอกสาร
              <input
                type="number"
                min={0}
                value={form.waitingDocuments}
                onChange={(event) =>
                  updateField("waitingDocuments", event.target.value)
                }
                placeholder="0"
                className="rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm text-gray-300 xl:col-span-2">
              หมายเหตุ
              <input
                type="text"
                value={form.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                placeholder="เช่น ติดตั้งเรียบร้อย, อื่นๆ"
                className="rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </label>
          </div>

          {statusMessage ? (
            <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              {statusMessage}
            </p>
          ) : null}

          {errorMessage ? (
            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-800"
            >
              {saving
                ? "กำลังบันทึก..."
                : editingId
                  ? "อัปเดตข้อมูล"
                  : "บันทึกข้อมูล"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-gray-700 px-5 py-2 text-sm font-medium text-gray-300 transition hover:bg-gray-800"
            >
              ล้างฟอร์ม
            </button>
            <span className="text-xs text-gray-500">
              บันทึกซ้ำวันที่เดิม = อัปเดตข้อมูลอัตโนมัติ
            </span>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">
            ตารางบันทึกประจำวัน ({monthKeyToThaiLabel(month)})
          </h3>
          <span className="text-xs text-gray-500">
            ทั้งหมด {rows.length} วัน
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[1300px] w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-800/60 text-xs uppercase tracking-[0.1em] text-gray-400">
                <th className="border border-gray-700 px-2 py-2">ลำดับ</th>
                <th className="border border-gray-700 px-2 py-2">วันที่</th>
                <th className="border border-gray-700 px-2 py-2">Line</th>
                <th className="border border-gray-700 px-2 py-2">เบอร์โทร</th>
                <th className="border border-gray-700 px-2 py-2">Facebook</th>
                <th className="border border-gray-700 px-2 py-2">
                  ยอดขายสำเร็จ
                </th>
                <th className="border border-gray-700 px-2 py-2">
                  ติดตั้งสำเร็จ
                </th>
                <th className="border border-gray-700 px-2 py-2">รอติดตั้ง</th>
                <th className="border border-gray-700 px-2 py-2">
                  ติดตั้งไม่ได้
                </th>
                <th className="border border-gray-700 px-2 py-2">
                  รอส่งเอกสาร
                </th>
                <th className="border border-gray-700 px-2 py-2">หมายเหตุ</th>
                <th className="border border-gray-700 px-2 py-2 text-center">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={12}
                    className="border border-gray-700 px-3 py-10 text-center text-sm text-gray-500"
                  >
                    ยังไม่มีข้อมูลในเดือนนี้
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-800/30 text-gray-200"
                  >
                    <td className="border border-gray-700 px-2 py-2 text-center">
                      {index + 1}
                    </td>
                    <td className="border border-gray-700 px-2 py-2 text-center">
                      {formatDateLabel(row.recordDate)}
                    </td>
                    <td className="border border-gray-700 px-2 py-2 text-center">
                      {displayMetric(row.lineLeads)}
                    </td>
                    <td className="border border-gray-700 px-2 py-2 text-center">
                      {displayMetric(row.phoneLeads)}
                    </td>
                    <td className="border border-gray-700 px-2 py-2 text-center">
                      {displayMetric(row.facebookLeads)}
                    </td>
                    <td className="border border-gray-700 px-2 py-2 text-center">
                      {displayMetric(row.salesSuccess)}
                    </td>
                    <td className="border border-gray-700 px-2 py-2 text-center">
                      {displayMetric(row.installSuccess)}
                    </td>
                    <td className="border border-gray-700 px-2 py-2 text-center">
                      {displayMetric(row.pendingInstall)}
                    </td>
                    <td className="border border-gray-700 px-2 py-2 text-center">
                      {displayMetric(row.installFailed)}
                    </td>
                    <td className="border border-gray-700 px-2 py-2 text-center">
                      {displayMetric(row.waitingDocuments)}
                    </td>
                    <td className="border border-gray-700 px-2 py-2 max-w-[260px] truncate">
                      {row.notes || "-"}
                    </td>
                    <td className="border border-gray-700 px-2 py-2">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(row)}
                          className="rounded-lg bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-300 transition hover:bg-blue-500/20"
                        >
                          แก้ไข
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(row)}
                          disabled={deletingId === row.id}
                          className="rounded-lg bg-rose-500/10 px-2 py-1 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
                        >
                          {deletingId === row.id ? "กำลังลบ..." : "ลบ"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {rows.length > 0 ? (
                <tr className="bg-gray-800/50 font-semibold text-gray-100">
                  <td
                    className="border border-gray-700 px-2 py-2 text-center"
                    colSpan={2}
                  >
                    รวม
                  </td>
                  <td className="border border-gray-700 px-2 py-2 text-center">
                    {formatNumber(summary.totalLineLeads)}
                  </td>
                  <td className="border border-gray-700 px-2 py-2 text-center">
                    {formatNumber(summary.totalPhoneLeads)}
                  </td>
                  <td className="border border-gray-700 px-2 py-2 text-center">
                    {formatNumber(summary.totalFacebookLeads)}
                  </td>
                  <td className="border border-gray-700 px-2 py-2 text-center">
                    {formatNumber(summary.totalSalesSuccess)}
                  </td>
                  <td className="border border-gray-700 px-2 py-2 text-center">
                    {formatNumber(summary.totalInstallSuccess)}
                  </td>
                  <td className="border border-gray-700 px-2 py-2 text-center">
                    {formatNumber(summary.totalPendingInstall)}
                  </td>
                  <td className="border border-gray-700 px-2 py-2 text-center">
                    {formatNumber(summary.totalInstallFailed)}
                  </td>
                  <td className="border border-gray-700 px-2 py-2 text-center">
                    {formatNumber(summary.totalWaitingDocuments)}
                  </td>
                  <td
                    className="border border-gray-700 px-2 py-2 text-center"
                    colSpan={2}
                  >
                    ลีดรวม {formatNumber(summary.totalLeads)}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
