"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Trash2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";

type Product = {
  id: string;
  sku: string;
  name: string;
  salePrice: number;
  taxPercent: number;
  stock: number;
};

type CartLine = {
  productId: string;
  name: string;
  price: number;
  taxPercent: number;
  quantity: number;
};

type Customer = { id: string; name: string };
type Branch = { id: string; name: string };
type Account = { id: string; name: string };

export function PosClient({
  products,
  customers,
  branches,
  accounts,
  defaultBranchId,
  currencySymbol,
  labels,
}: {
  products: Product[];
  customers: Customer[];
  branches: Branch[];
  accounts: Account[];
  defaultBranchId: string;
  currencySymbol: string;
  labels: Record<string, string>;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [branchId, setBranchId] = useState(defaultBranchId);
  const [customerId, setCustomerId] = useState<string>("");
  const [discount, setDiscount] = useState<number>(0);
  const [paid, setPaid] = useState<number>(0);
  const [accountId, setAccountId] = useState<string>("");
  const [notes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q),
        )
      : products;
    return list.slice(0, 60);
  }, [products, search]);

  const subtotal = cart.reduce((a, l) => a + l.price * l.quantity, 0);
  const tax = cart.reduce(
    (a, l) => a + (l.price * l.quantity * l.taxPercent) / 100,
    0,
  );
  const total = Math.max(0, subtotal + tax - discount);
  const due = Math.max(0, total - paid);

  function addToCart(p: Product) {
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.productId === p.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 };
        return copy;
      }
      return [
        ...prev,
        {
          productId: p.id,
          name: p.name,
          price: p.salePrice,
          taxPercent: p.taxPercent,
          quantity: 1,
        },
      ];
    });
  }

  function updateQty(productId: string, qty: number) {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((l) => l.productId !== productId);
      return prev.map((l) => (l.productId === productId ? { ...l, quantity: qty } : l));
    });
  }

  function updatePrice(productId: string, price: number) {
    setCart((prev) =>
      prev.map((l) =>
        l.productId === productId ? { ...l, price: Math.max(0, price) } : l,
      ),
    );
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  }

  async function checkout() {
    if (cart.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId,
          customerId: customerId || null,
          discount,
          paid,
          accountId: accountId || null,
          notes,
          items: cart.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            price: l.price,
            discount: 0,
            taxPercent: l.taxPercent,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create sale");
        return;
      }
      router.push(`/sales/${data.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[calc(100vh-8rem)]">
      <div className="lg:col-span-3 flex flex-col min-h-0">
        <div className="mb-3 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              autoFocus
              placeholder={labels.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => addToCart(p)}
                className="text-left rounded-md border border-slate-200 bg-white p-3 hover:border-blue-500 hover:shadow transition"
              >
                <div className="text-xs text-slate-500 font-mono truncate">{p.sku}</div>
                <div className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
                  {p.name}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-semibold text-blue-700">
                    {formatMoney(p.salePrice, currencySymbol)}
                  </span>
                  <span className="text-xs text-slate-500">
                    {labels.stock}: {p.stock}
                  </span>
                </div>
              </button>
            ))}
            {filtered.length === 0 ? (
              <div className="col-span-full text-center text-slate-500 py-12">
                {labels.no_data}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <Card className="lg:col-span-2 flex flex-col min-h-0">
        <CardHeader>
          <CardTitle>{labels.cart}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-3 min-h-0">
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
          >
            <option value="">{labels.walk_in}</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="flex-1 overflow-y-auto border rounded-md">
            {cart.length === 0 ? (
              <div className="text-center text-slate-500 py-10 text-sm">
                {labels.cart_empty}
              </div>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {cart.map((l) => (
                    <tr key={l.productId} className="border-b last:border-0">
                      <td className="p-2">
                        <div className="font-medium">{l.name}</div>
                        <div className="flex items-center gap-1 mt-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => updateQty(l.productId, l.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={l.quantity}
                            onChange={(e) =>
                              updateQty(l.productId, Number(e.target.value || 0))
                            }
                            className="h-7 w-16 text-center"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => updateQty(l.productId, l.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <span className="mx-1">×</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={l.price}
                            onChange={(e) =>
                              updatePrice(l.productId, Number(e.target.value || 0))
                            }
                            className="h-7 w-24"
                          />
                        </div>
                      </td>
                      <td className="p-2 text-right whitespace-nowrap font-semibold">
                        {formatMoney(l.price * l.quantity, currencySymbol)}
                      </td>
                      <td className="p-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeLine(l.productId)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span>{labels.subtotal}</span>
              <span>{formatMoney(subtotal, currencySymbol)}</span>
            </div>
            <div className="flex justify-between">
              <span>{labels.tax}</span>
              <span>{formatMoney(tax, currencySymbol)}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
              <span>{labels.discount}</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value || 0))}
                className="h-7 w-28 text-right"
              />
            </div>
            <div className="flex justify-between items-center gap-2">
              <span>{labels.paid}</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={paid}
                onChange={(e) => setPaid(Number(e.target.value || 0))}
                className="h-7 w-28 text-right"
              />
            </div>
            <div className="flex justify-between font-semibold border-t pt-2">
              <span>{labels.total}</span>
              <span>{formatMoney(total, currencySymbol)}</span>
            </div>
            <div className="flex justify-between text-red-600 font-medium">
              <span>{labels.due}</span>
              <span>{formatMoney(due, currencySymbol)}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="account">Account</Label>
            <select
              id="account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">—</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button
            type="button"
            onClick={checkout}
            disabled={cart.length === 0 || submitting}
            className="w-full"
            size="lg"
          >
            {submitting ? labels.loading : labels.complete}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
