import { topupPromotions } from "@/src/data/topup";

export default function PromotionBanner() {
  return (
    <section className="mx-auto mt-2 max-w-7xl px-4">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-5 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg md:text-xl font-extrabold text-slate-900">โปรโมชันเติมเงินแนะนำ</h2>
          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
            {topupPromotions.length} รายการ
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {topupPromotions.slice(0, 4).map((item) => (
            <article key={item.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">validity {item.validity}</p>
              <h3 className="mt-1 text-sm font-bold text-slate-900 line-clamp-2">{item.title}</h3>
              <p className="mt-2 text-xs text-slate-600 line-clamp-2">{item.speed}</p>
              <p className="mt-3 text-xl font-black text-slate-900">฿{item.price.toLocaleString()}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
