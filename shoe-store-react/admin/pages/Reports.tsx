import { db } from "../lib/store";

export default function Reports() {
  const byDay = db.revenueByDay(14);
  const top = db.topSellers(10);
  const inv = db.inventory();
  const products = db.listProducts();
  const revenue = byDay.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Thống kê – báo cáo</h1>
        <p className="text-muted-foreground">Doanh thu theo ngày, sản phẩm bán chạy, tồn kho</p>
      </div>
      <section className="space-y-2">
        <h2 className="font-semibold">Doanh thu 14 ngày</h2>
        <div className="grid grid-cols-14 gap-2 text-xs">
          {byDay.map(d => (
            <div key={d.date} className="text-center">
              <div className="h-24 w-full bg-accent/40 rounded" style={{ height: Math.max(6, (d.revenue / (revenue || 1)) * 96) }} />
              <div className="mt-1">{d.date.slice(5)}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold mb-2">Top bán chạy</h2>
          <div className="space-y-3">
            {top.map(i => {
              const p = products.find(pp => pp.title === i.title);
              return (
                <div key={i.title} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {p?.images?.[0] ? (
                      <img src={p.images[0]} alt={p.title} className="h-10 w-10 rounded object-cover border" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted" />
                    )}
                    <div className="min-w-0">
                      <div className="truncate font-medium">{i.title}</div>
                      {p && <div className="text-xs text-muted-foreground">{p.brand || "—"} • {p.price.toLocaleString("vi-VN")}₫</div>}
                    </div>
                  </div>
                  <div className="font-medium shrink-0">{i.sold}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <h2 className="font-semibold mb-2">Tồn kho</h2>
          <div className="space-y-3">
            {inv.map(i => {
              const p = products.find(pp => pp.title === i.title);
              return (
                <div key={i.title} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {p?.images?.[0] ? (
                      <img src={p.images[0]} alt={p?.title || i.title} className="h-10 w-10 rounded object-cover border" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted" />
                    )}
                    <div className="min-w-0">
                      <div className="truncate font-medium">{i.title}</div>
                      {p && <div className="text-xs text-muted-foreground">{p.brand || "—"} • {p.price.toLocaleString("vi-VN")}₫</div>}
                    </div>
                  </div>
                  <div className={i.stock < 5 ? "text-red-600 font-medium" : "font-medium"}>{i.stock}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
