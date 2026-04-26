"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, AlertTriangle } from "lucide-react";

export function RestoreCard() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleRestore() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const text = await file.text();
      const res = await fetch("/api/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: text,
      });
      const data: { ok?: boolean; error?: string } = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || `Restore failed (HTTP ${res.status})`);
      } else {
        setSuccess("Restore completed successfully.");
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Restore failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Restore from Backup
        </CardTitle>
        <CardDescription>
          Imports a previously exported JSON snapshot. Records are upserted by
          ID — existing rows with the same ID will be overwritten. User
          passwords are preserved (only existing users are updated).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            Restore is destructive: it overwrites matching records. Export a
            fresh backup first if you want a rollback point.
          </div>
        </div>
        <input
          type="file"
          accept="application/json,.json"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setError(null);
            setSuccess(null);
          }}
          className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-white file:hover:bg-blue-700"
        />
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </div>
        )}
        <Button onClick={handleRestore} disabled={!file || busy}>
          <Upload className="h-4 w-4" />
          {busy ? "Restoring…" : "Restore Database"}
        </Button>
      </CardContent>
    </Card>
  );
}
