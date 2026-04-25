"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";

type Product = { id: string; sku: string; name: string; costPrice: number };
type Supplier = { id: string; name: string };
type Branch = { id: string; name: string };
type Account = { id: string; name: string };

type Line = {
  productId: string;
  name: string;
  cost: number;
  quantity: number;
};

export function PurchaseClient({
  products,
  suppliers,
  branches,
  accounts,
  defaultBranchId,
  currencySymbol,
  labels,
}: {
  products: Product[];
  suppliers: Supplier[];
  branches: Branch[];
  accounts: Account[];
  defaultBranchId: string;
  currencySymbol: string;
  labels: Record<string, string>;
}) {
  const router = useRouter();
  const [branchId, setBranchId] = useState(defaultBranchId);
  const [supplierId, setSupplierId] = useState<string>(suppliers[0]?.id ?? "");
  const [discount, setDiscount] = useState<number>(0);
  const [paid, setPaid] = useState<number>(0);
  const [accountId, setAccountId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products.slice(0, 20);
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [products, search]);

  function addProduct(p: Product) {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.productId === p.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 };
        return copy;
      }
      return [...prev, { productId: p.id, name: p.name, cost: p.costPrice, quantity: 1 }];
    });
    setSearch("");
  }

  const subtotal = lines.reduce((a, l) => a + l.cost * l.quantity, 0);
  const total = Math.max(0, subtotal - discount);
  const due = Math.max(0, total - paid);

  async function submit() {
    if (lines.length === 0 || !supplierId) {
      setError("Add at least one item and supplier");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId,
          supplierId,
          discount,
          paid,
          accountId: accountId || null,
          notes,
          items: lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            cost: l.cost,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      router.push(`/purchases/${data.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Input
              placeholder="Search product to add…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search ? (
              <div className="absolute z-10 left-0 right-0 mt-1 max-h-72 overflow-y-auto rounded-md border bg-white shadow-md">
                {filtered.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => addProduct(p)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b last:border-0 text-sm flex justify-between"
                  >
                    <span>
                      <span className="font-mono text-xs text-slate-500">{p.sku}</span>{" "}
                      {p.name}
                    </span>
                    <span className="text-slate-500">
                      {formatMoney(p.costPrice, currencySymbol)}
                    </span>
                  </button>
                ))}
                {filtered.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-slate-500">No results</div>
                ) : null}
              </div>
            ) : null}
          </div>

          <table className="w-full text-sm border rounded-md overflow-hidden">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-2">{labels.name}</th>
                <th className="text-right p-2">{labels.qty}</th>
                <th className="text-right p-2">{labels.cost}</th>
                <th className="text-right p-2">{labels.total}</th>
                <th className="p-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-slate-500 p-4">
                    No items
                  </td>
                </tr>
              ) : (
                lines.map((l) => (
                  <tr key={l.productId} className="border-t">
                    <td className="p-2">{l.name}</td>
                    <td className="p-2 text-right">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={l.quantity}
                        onChange={(e) =>
                          setLines((prev) =>
                            prev.map((x) =>
                              x.productId === l.productId
                                ? { ...x, quantity: Math.max(0, Number(e.target.value || 0)) }
                                : x,
                            ),
                          )
                        }
                        className="h-8 w-24 ml-auto text-right"
                      />
                    </td>
                    <td className="p-2 text-right">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={l.cost}
                        onChange={(e) =>
                          setLines((prev) =>
                            prev.map((x) =>
                              x.productId === l.productId
                                ? { ...x, cost: Math.max(0, Number(e.target.value || 0)) }
                                : x,
                            ),
                          )
                        }
                        className="h-8 w-28 ml-auto text-right"
                      />
                    </td>
                    <td className="p-2 text-right font-medium">
                      {formatMoney(l.cost * l.quantity, currencySymbol)}
                    </td>
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() =>
                          setLines((prev) => prev.filter((x) => x.productId !== l.productId))
                        }
                        className="text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{labels.summary}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="branch">{labels.branch}</Label>
            <select
              id="branch"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="supplier">{labels.supplier}</Label>
            <select
              id="supplier"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
            >
              <option value="">—</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span>{labels.subtotal}</span>
              <span>{formatMoney(subtotal, currencySymbol)}</span>
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
            <div className="flex justify-between font-semibold border-t pt-2">
              <span>{labels.total}</span>
              <span>{formatMoney(total, currencySymbol)}</span>
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
            <div className="flex justify-between text-red-600">
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
          <div className="space-y-1.5">
            <Label htmlFor="notes">{labels.notes}</Label>
            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button
            type="button"
            onClick={submit}
            disabled={submitting || lines.length === 0}
            className="w-full"
            size="lg"
          >
            <Plus className="h-4 w-4" />
            {submitting ? labels.loading : labels.create}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
