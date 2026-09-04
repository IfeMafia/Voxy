"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getProduct, updateProduct, deleteProduct, formatNGN, nairaToKobo } from "@/lib/api/products";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  ShoppingBag,
  Tag,
  Package,
  Bot,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import { toast } from "react-hot-toast";

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="size-8 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="size-4 text-[#00D18F]" />
      </div>
      <div>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function Field({ label, hint, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
        {label} {required && <span className="text-[#00D18F]">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-zinc-600 mt-1">{hint}</p>}
    </div>
  );
}

const INPUT = "w-full bg-[#0a0a0a] border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00D18F]/50 focus:ring-1 focus:ring-[#00D18F]/10 transition-all";
const TEXTAREA = INPUT + " resize-none";

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!id) return;
    getProduct(id)
      .then((p) => {
        setForm({
          name: p.name || "",
          description: p.description || "",
          priceNaira: p.priceKobo ? (p.priceKobo / 100).toString() : "",
          discountNaira: p.discountKobo ? (p.discountKobo / 100).toString() : "",
          stockQuantity: p.stockQuantity?.toString() || "",
          tags: (p.tags || []).join(", "),
          imageUrl: p.imageUrl || "",
          isAvailable: p.isAvailable ?? true,
          voxyNote: p.voxyNote || "",
        });
      })
      .catch(() => setError("Failed to load product."))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const effectivePrice = (parseFloat(form?.priceNaira) || 0) - (parseFloat(form?.discountNaira) || 0);
  const discount = parseFloat(form?.discountNaira) || 0;
  const discountPct =
    discount > 0 && parseFloat(form?.priceNaira) > 0
      ? Math.round((discount / parseFloat(form.priceNaira)) * 100)
      : 0;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError("");
    if (!form.name.trim()) { setError("Product name is required."); return; }
    if (!form.priceNaira || parseFloat(form.priceNaira) <= 0) { setError("Price must be greater than zero."); return; }
    setSaving(true);
    try {
      await updateProduct(id, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        priceKobo: nairaToKobo(form.priceNaira),
        discountKobo: form.discountNaira ? nairaToKobo(form.discountNaira) : 0,
        imageUrl: form.imageUrl.trim() || undefined,
        stockQuantity: form.stockQuantity ? parseInt(form.stockQuantity) : null,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        isAvailable: form.isAvailable,
      });
      toast.success("Product updated");
      router.push(`/business/products/${id}`);
    } catch (err) {
      setError(err.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Remove "${form?.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await deleteProduct(id);
      toast.success("Product removed");
      router.push("/business/products");
    } catch (err) {
      toast.error(err.message || "Failed to remove product.");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Edit Product">
        <div className="flex items-center justify-center h-60">
          <Loader2 className="size-6 animate-spin text-zinc-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!form) {
    return (
      <DashboardLayout title="Edit Product">
        <div className="flex items-center justify-center h-60 text-sm text-zinc-500">
          Product not found.{" "}
          <Link href="/business/products" className="text-[#00D18F] ml-2 hover:underline">Go back</Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Edit Product">
      <div className="max-w-5xl mx-auto pb-24">
        <div className="flex items-center gap-2 py-4 mb-2">
          <Link href={`/business/products/${id}`} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft className="size-3.5" />
            Product detail
          </Link>
          <span className="text-zinc-700">/</span>
          <span className="text-xs text-zinc-400">Edit</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Main form ─── */}
          <div className="flex-1 min-w-0 space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20 text-sm text-red-400">
                <AlertCircle className="size-4 shrink-0" /> {error}
              </div>
            )}

            <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-2xl p-5 sm:p-6">
              <SectionHeader icon={ShoppingBag} title="Basic Information" description="The name and description Voxy uses to describe this product to customers." />
              <div className="space-y-4">
                <Field label="Product name" required>
                  <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Jollof Rice & Chicken" className={INPUT} />
                </Field>
                <Field label="Description" hint="A clear description helps Voxy answer customer questions accurately.">
                  <textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe ingredients, size, what's included…" rows={3} className={TEXTAREA} />
                </Field>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-2xl p-5 sm:p-6">
              <SectionHeader icon={Tag} title="Pricing" description="Set the selling price. Add a discount if you are running a promotion." />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Price (₦)" required>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500 font-medium">₦</span>
                    <input type="number" min="0" step="any" value={form.priceNaira} onChange={(e) => set("priceNaira", e.target.value)} placeholder="0.00" className={INPUT + " pl-7"} />
                  </div>
                </Field>
                <Field label="Discount (₦)" hint={discountPct > 0 ? `${discountPct}% off — customer pays ₦${effectivePrice.toLocaleString()}` : "Optional promotional discount."}>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500 font-medium">₦</span>
                    <input type="number" min="0" step="any" value={form.discountNaira} onChange={(e) => set("discountNaira", e.target.value)} placeholder="0.00" className={INPUT + " pl-7"} />
                  </div>
                </Field>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-2xl p-5 sm:p-6">
              <SectionHeader icon={Package} title="Inventory" description="Stock tracking helps Voxy avoid selling items that are out of stock." />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Stock quantity" hint="Leave blank for unlimited stock.">
                  <input type="number" min="0" value={form.stockQuantity} onChange={(e) => set("stockQuantity", e.target.value)} placeholder="e.g. 50" className={INPUT} />
                </Field>
                <Field label="Tags" hint="Comma-separated. Helps Voxy categorise and recommend.">
                  <input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="e.g. food, lunch, spicy" className={INPUT} />
                </Field>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-2xl overflow-hidden">
              <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-between px-5 sm:px-6 py-4 text-left hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
                    <Bot className="size-4 text-zinc-500" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-white">Advanced options</span>
                    <p className="text-xs text-zinc-500">Image URL, Voxy sales notes</p>
                  </div>
                </div>
                {showAdvanced ? <ChevronUp className="size-4 text-zinc-500" /> : <ChevronDown className="size-4 text-zinc-500" />}
              </button>
              {showAdvanced && (
                <div className="px-5 sm:px-6 pb-6 space-y-4 border-t border-white/[0.05]">
                  <div className="pt-4">
                    <Field label="Image URL" hint="Paste a direct link to a product image.">
                      <input value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://example.com/product.jpg" className={INPUT} />
                    </Field>
                  </div>
                  <Field label="Voxy sales note" hint="Private guidance for Voxy. Customers don't see this.">
                    <textarea value={form.voxyNote} onChange={(e) => set("voxyNote", e.target.value)} placeholder="e.g. Emphasise freshness. Upsell the drink combo." rows={2} className={TEXTAREA} />
                  </Field>
                </div>
              )}
            </div>
          </div>

          {/* ── Sidebar ─── */}
          <div className="w-full lg:w-64 xl:w-72 shrink-0 space-y-4">
            <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-2xl p-5">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Status & Availability</h3>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">{form.isAvailable ? "Active" : "Hidden"}</div>
                  <div className="text-[11px] text-zinc-600 mt-0.5">
                    {form.isAvailable ? "Visible to customers via Voxy." : "Hidden from customers."}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => set("isAvailable", !form.isAvailable)}
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 transition-colors ${form.isAvailable ? "bg-[#00D18F] border-[#00D18F]" : "bg-white/10 border-white/10"}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-black transition-transform ${form.isAvailable ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>

            {form.priceNaira && (
              <div className="bg-[#0a0a0a] border border-white/[0.07] rounded-2xl p-5">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Price Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-zinc-400">
                    <span>List price</span>
                    <span className="tabular-nums">₦{parseFloat(form.priceNaira || 0).toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-red-400">
                      <span>Discount</span>
                      <span className="tabular-nums">−₦{discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-white pt-2 border-t border-white/[0.06]">
                    <span>Customer pays</span>
                    <span className="text-[#00D18F] tabular-nums">₦{effectivePrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <button onClick={handleSubmit} disabled={saving} className="w-full h-10 bg-[#00D18F] text-black text-sm font-semibold rounded-xl hover:bg-[#00D18F]/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                {saving ? "Saving…" : "Save changes"}
              </button>
              <Link href={`/business/products/${id}`} className="w-full h-10 border border-white/[0.08] text-zinc-400 text-sm font-medium rounded-xl hover:text-white hover:border-white/[0.15] transition-colors flex items-center justify-center">
                Cancel
              </Link>
              <button onClick={handleDelete} disabled={deleting} className="w-full h-10 border border-red-500/20 text-red-400 text-sm font-medium rounded-xl hover:bg-red-500/5 hover:border-red-500/30 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                Delete product
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
