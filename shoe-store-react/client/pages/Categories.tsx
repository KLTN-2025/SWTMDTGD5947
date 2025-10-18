import { Layout } from "@/components/layout/Layout";
import { Link } from "react-router-dom";

const CATS = [
  { k: "sneaker", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop" },
  { k: "thể thao", img: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=1200&auto=format&fit=crop" },
  { k: "công sở", img: "https://images.unsplash.com/photo-1619983081563-430f63602796?q=80&w=1200&auto=format&fit=crop" },
  { k: "boot", img: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop" },
];

export default function CategoriesPage() {
  return (
    <Layout>
      <section className="container py-8">
        <h1 className="text-2xl md:text-3xl font-bold">Danh mục sản phẩm</h1>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATS.map((c)=> (
            <Link key={c.k} to={`/products?type=${encodeURIComponent(c.k)}`} className="relative rounded-2xl overflow-hidden group">
              <img src={c.img} alt={c.k} className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/0" />
              <div className="absolute bottom-3 left-3 text-white font-semibold">{c.k.toUpperCase()}</div>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  );
}
