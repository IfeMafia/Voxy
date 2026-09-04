"use client";

import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { listProducts, createProduct, updateProduct, deleteProduct, formatNGN, nairaToKobo } from "@/lib/api/products";
import { ShoppingBag, Plus, X, Loader2, Edit2, Trash2, AlertCircle, ImageIcon, Tag, CheckCircle } from "lucide-react";
import { toast } from "react-hot-toast";

const EMPTY_FORM = {
  name: "", description: "", priceNaira: "", discountNaira: "",
  imageUrl: "", stockQuantity: "", tags: "", isAvailable: true,
};

function ProductModal({ product, businessId, onSave, onClose }) {
  const isEdit = !!product;
  const [form, setForm] = useState(
    product
      ? {
          name: product.name || "",
          description: product.description || "",
          priceNaira: product.priceKobo ? (product.priceKobo / 100).toString() : "",
          discountNaira: product.discountKobo ? (product.discountKobo / 100).toString() : "",
          imageUrl: product.imageUrl || "",
          stockQuantity: product.stockQuantity?.toString() || "",
          tags: (product.tags || []).join(", "),
          isAvailable: product.isAvailable ?? true,
        }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.priceNaira) {
      setError("Name and price are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        priceKobo: nairaToKobo(form.priceNaira),
        discountKobo: form.discountNaira ? nairaToKobo(form.discountNaira) : 0,
        imageUrl: form.imageUrl.trim() || undefined,
        stockQuantity: form.stockQuantity ? parseInt(form.stockQuantity) : null,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        isAvailable: form.isAvailable,
      };
      if (isEdit) {
        await updateProduct(product.id, payload);
      } else {
        await createProduct(businessId, payload);
      }
      onSave();
    } catch (err) {
      setError(err.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h2 className="font-semibold text-white text-sm">{isEdit ? "Edit product" : "Add product"}</h2>
          <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <X className="size-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              <AlertCircle className="size-3.5 shrink-0" /> {error}
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Product name *</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Jollof Rice"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00D18F]/40 transition-colors" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Description</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
              placeholder="Describe the product..." rows={2}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00D18F]/40 transition-colors resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Price (₦) *</label>
              <input type="number" min="0" step="any" value={form.priceNaira} onChange={(e) => set("priceNaira", e.target.value)}
                placeholder="2500"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00D18F]/40 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Discount (₦)</label>
              <input type="number" min="0" step="any" value={form.discountNaira} onChange={(e) => set("discountNaira", e.target.value)}
                placeholder="0"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00D18F]/40 transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block flex items-center gap-1.5">
              <ImageIcon className="size-3" /> Image URL
              <span className="ml-auto text-orange-400 font-normal">Upload coming soon</span>
            </label>
            <input value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00D18F]/40 transition-colors" />
            <p className="text-[10px] text-zinc-700 mt-1">Paste a direct image URL. Image upload storage is not yet available.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Stock quantity</label>
              <input type="number" min="0" value={form.stockQuantity} onChange={(e) => set("stockQuantity", e.target.value)}
                placeholder="Leave blank if unlimited"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00D18F]/40 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block flex items-center gap-1"><Tag className="size-3" /> Tags</label>
              <input value={form.tags} onChange={(e) => set("tags", e.target.value)}
                placeholder="rice, main, party"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00D18F]/40 transition-colors" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => set("isAvailable", !form.isAvailable)}
              className={`w-10 h-5 rounded-full border transition-all ${form.isAvailable ? "bg-[#00D18F] border-[#00D18F]" : "bg-white/5 border-white/10"}`}>
              <div className={`size-4 rounded-full bg-black transition-transform mx-0.5 ${form.isAvailable ? "translate-x-[20px]" : "translate-x-0"}`} />
            </button>
            <span className="text-xs text-zinc-400">Available for sale</span>
          </div>
          <button type="submit" disabled={saving}
            className="w-full h-10 bg-[#00D18F] text-black font-semibold rounded-lg hover:bg-[#00D18F]/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-sm">
            {saving ? <Loader2 className="size-4 animate-spin" /> : isEdit ? "Save changes" : "Add product"}
          </button>
        </form>
      </div>
    </div>
  );
}

function ProductCard({ product, onEdit, onDelete }) {
  const effectivePrice = (product.priceKobo || 0) - (product.discountKobo || 0);
  return (
    <div className={`rounded-xl border ${product.isAvailable ? "border-white/[0.07]" : "border-white/[0.04] opacity-60"} bg-white/[0.02] overflow-hidden`}>
      {product.imageUrl ? (
        <div className="h-36 bg-white/[0.03] overflow-hidden">
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="h-36 bg-white/[0.02] flex items-center justify-center">
          <ShoppingBag className="size-8 text-zinc-800" />
        </div>
      )}
      <div className="p-3 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold text-sm text-white leading-tight">{product.name}</span>
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${product.isAvailable ? "bg-[#00D18F]/10 text-[#00D18F]" : "bg-white/5 text-zinc-500"}`}>
            {product.isAvailable ? "Active" : "Hidden"}
          </span>
        </div>
        {product.description && (
          <p className="text-xs text-zinc-600 line-clamp-2">{product.description}</p>
        )}
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-sm font-bold text-white">{formatNGN(effectivePrice)}</span>
            {product.discountKobo > 0 && (
              <span className="text-xs text-zinc-600 line-through ml-1.5">{formatNGN(product.priceKobo)}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onEdit(product)} className="p-1.5 text-zinc-600 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <Edit2 className="size-3.5" />
            </button>
            <button onClick={() => onDelete(product)} className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors">
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
        {product.stockQuantity !== null && product.stockQuantity !== undefined && (
          <p className="text-[10px] text-zinc-700">{product.stockQuantity} in stock</p>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await listProducts(user.id, { available: false });
      setProducts(data?.products || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user?.id]);

  const handleDelete = async (product) => {
    if (!confirm(`Remove "${product.name}"? This will hide it from Voxy.`)) return;
    try {
      await deleteProduct(product.id);
      setProducts((p) => p.filter((x) => x.id !== product.id));
      toast.success("Product removed");
    } catch (e) { toast.error(e.message); }
  };

  const handleSaved = () => {
    setModalOpen(false);
    setEditProduct(null);
    load();
    toast.success("Product saved");
  };

  return (
    <DashboardLayout title="Products">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">Products</h1>
            <p className="text-xs text-zinc-500 mt-0.5">{products.length} product{products.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={() => { setEditProduct(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#00D18F] text-black text-sm font-semibold rounded-lg hover:bg-[#00D18F]/90 transition-colors">
            <Plus className="size-4" /> Add product
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-zinc-600" /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-white/[0.08] rounded-2xl">
            <ShoppingBag className="size-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-400 font-medium mb-1">No products yet</p>
            <p className="text-xs text-zinc-600 mb-5">Add your products so Voxy can recommend and sell them.</p>
            <button onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#00D18F] text-black text-sm font-semibold rounded-lg hover:bg-[#00D18F]/90 transition-colors">
              <Plus className="size-4" /> Add product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p}
                onEdit={(p) => { setEditProduct(p); setModalOpen(true); }}
                onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <ProductModal
          product={editProduct}
          businessId={user?.id}
          onSave={handleSaved}
          onClose={() => { setModalOpen(false); setEditProduct(null); }}
        />
      )}
    </DashboardLayout>
  );
}
