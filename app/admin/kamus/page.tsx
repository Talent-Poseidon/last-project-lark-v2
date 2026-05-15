"use client";

import React, { useEffect, useRef, useState } from "react";

interface KamusItem {
  id: string;
  code: string;
  name: string;
  type: string;
  description: string;
  behavioralIndicators: string;
}

interface RowError {
  rowNumber: number;
  field?: string;
  message: string;
}

interface PreviewRow {
  code: string;
  name: string;
  type: string;
}

interface Preview {
  preview: true;
  created: PreviewRow[];
  updated: PreviewRow[];
  unchanged: PreviewRow[];
  deleted: PreviewRow[];
}

export const dynamic = "force-dynamic";

export default function KamusPage() {
  const [items, setItems] = useState<KamusItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<RowError[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [pendingCsv, setPendingCsv] = useState<string>("");
  const [deleteError, setDeleteError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadItems() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (search) params.set("q", search);
      const res = await fetch(`/api/kamus?${params.toString()}`);
      const data: KamusItem[] = await res.json();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, search]);

  async function submitCsv(csv: string, confirm: boolean) {
    setIsUploading(true);
    setUploadProgress(20);
    setValidationErrors([]);
    setErrorMessage("");
    setSuccessMessage("");
    setDeleteError("");
    try {
      setUploadProgress(50);
      const res = await fetch("/api/kamus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, confirm }),
      });
      setUploadProgress(90);
      const data = await res.json();

      if (!res.ok) {
        if (Array.isArray(data.errors)) {
          setValidationErrors(data.errors);
        } else if (data.blockedDeletes) {
          setDeleteError(
            "Cannot delete kamus items used by Standar Jabatan or Scenario: " +
              data.blockedDeletes
                .map((b: { code: string; reason: string }) => `${b.code} (${b.reason})`)
                .join(", ")
          );
        } else {
          setErrorMessage(data.error || "Upload failed");
        }
        return;
      }

      if (data.preview) {
        setPreview(data as Preview);
        setPendingCsv(csv);
        return;
      }

      setSuccessMessage(
        `Kamus Submitted: ${data.totalItems} items (created ${data.createdCount}, updated ${data.updatedCount}, deleted ${data.deletedCount})`
      );
      setPreview(null);
      setPendingCsv("");
      await loadItems();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadProgress(100);
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 800);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    await submitCsv(text, false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function confirmPreview() {
    if (!pendingCsv) return;
    await submitCsv(pendingCsv, true);
  }

  function cancelPreview() {
    setPreview(null);
    setPendingCsv("");
  }

  async function handleDelete(id: string) {
    setDeleteError("");
    try {
      const res = await fetch(`/api/kamus/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error || "Delete failed");
        return;
      }
      await loadItems();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-6" data-testid="kamus-page-container">
      <nav data-testid="kamus-page-nav" className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kamus Potensi &amp; Kompetensi</h1>
        <a
          href="/api/kamus/template"
          data-testid="kamus-template-download-btn"
          className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
          download
        >
          Download Template
        </a>
      </nav>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-3 text-lg font-semibold">Upload Template</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Upload a CSV file containing kamus items. Required columns: code, name, type, description, behavioral_indicators.
        </p>
        <form data-testid="kamus-upload-form" onSubmit={(e) => e.preventDefault()}>
          <input
            ref={fileInputRef}
            type="file"
            name="file"
            accept=".csv,text/csv,text/plain"
            data-testid="kamus-file-input"
            onChange={handleFileChange}
            disabled={isUploading}
            className="block w-full text-sm text-foreground"
          />
        </form>

        {(isUploading || uploadProgress > 0) && (
          <div
            data-testid="kamus-upload-progress"
            className="mt-3 h-2 w-full overflow-hidden rounded bg-muted"
            role="progressbar"
            aria-valuenow={uploadProgress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {validationErrors.length > 0 && (
          <div
            data-testid="kamus-error-alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <p className="font-semibold">Validation failed</p>
            <ul data-testid="kamus-error-list" className="mt-2 list-disc pl-5">
              {validationErrors.map((err: RowError, i: number) => (
                <li key={i} data-testid={`kamus-error-row-${err.rowNumber}`}>
                  Row {err.rowNumber}
                  {err.field ? ` [${err.field}]` : ""}: {err.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {errorMessage && (
          <div
            data-testid="kamus-upload-error-alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            data-testid="kamus-created-alert"
            className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"
          >
            {successMessage}
          </div>
        )}
      </section>

      {preview && (
        <section
          data-testid="kamus-preview-section"
          className="rounded-xl border border-amber-200 bg-amber-50 p-6"
        >
          <h2 className="mb-3 text-lg font-semibold text-amber-900">
            Preview Changes
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div data-testid="kamus-preview-created">
              <p className="font-semibold text-green-800">
                New ({preview.created.length})
              </p>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {preview.created.map((r) => (
                  <li key={`new-${r.code}`}>
                    {r.code} — {r.name}
                  </li>
                ))}
              </ul>
            </div>
            <div data-testid="kamus-preview-updated">
              <p className="font-semibold text-blue-800">
                Changed ({preview.updated.length})
              </p>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {preview.updated.map((r) => (
                  <li key={`upd-${r.code}`}>
                    {r.code} — {r.name}
                  </li>
                ))}
              </ul>
            </div>
            <div data-testid="kamus-preview-deleted">
              <p className="font-semibold text-red-800">
                Deleted ({preview.deleted.length})
              </p>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {preview.deleted.map((r) => (
                  <li key={`del-${r.code}`}>
                    {r.code} — {r.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              data-testid="kamus-preview-confirm-btn"
              onClick={confirmPreview}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Confirm changes
            </button>
            <button
              type="button"
              data-testid="kamus-preview-cancel-btn"
              onClick={cancelPreview}
              className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search by name or code"
            data-testid="kamus-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
          <select
            data-testid="kamus-type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All types</option>
            <option value="potensi">Potensi</option>
            <option value="kompetensi">Kompetensi</option>
          </select>
        </div>

        {deleteError && (
          <div
            data-testid="kamus-delete-error-alert"
            className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          >
            {deleteError}
          </div>
        )}

        <div data-testid="kamus-list-container">
          {loading ? (
            <p data-testid="kamus-list-loading">Loading...</p>
          ) : items.length > 0 ? (
            <table data-testid="kamus-list" className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: KamusItem) => (
                  <tr
                    key={item.id}
                    data-testid={`kamus-item-${item.code}`}
                    className="border-b"
                  >
                    <td className="px-3 py-2 font-mono">{item.code}</td>
                    <td className="px-3 py-2">{item.name}</td>
                    <td className="px-3 py-2">
                      <span
                        data-testid={`kamus-type-${item.code}`}
                        className="rounded bg-muted px-2 py-0.5 text-xs"
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {item.description}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        data-testid={`kamus-delete-${item.code}-btn`}
                        onClick={() => handleDelete(item.id)}
                        className="rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p data-testid="kamus-list-empty">No kamus items found</p>
          )}
        </div>
      </section>
    </div>
  );
}
