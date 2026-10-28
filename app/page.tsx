"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnalyzeRequest, AnalyzeResponse } from "@/lib/types";
import { saveResult } from "@/lib/store";

const SAMPLE: AnalyzeRequest = {
  review_text:
    "This seller is a scam. The item arrived damaged and clearly used, different color than pictured. Stopped working after two days. Want my refund back, worst purchase ever.",
  rating: 1,
  verified_purchase: false,
  has_image: true,
  asin: "B07XJ8C1F5",
  review_month: "2023-05",
  reviewer_review_count: 48,
  reviewer_negative_ratio: 0.82,
  reviewer_product_count: 21
};

const RATINGS = [1, 2, 3, 4, 5];

export default function HomePage() {
  const router = useRouter();
  const [form, setForm] = useState<AnalyzeRequest>({
    review_text: "",
    rating: 1,
    verified_purchase: true,
    has_image: false,
    asin: "",
    review_month: "",
    reviewer_review_count: null,
    reviewer_negative_ratio: null,
    reviewer_product_count: null
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof AnalyzeRequest>(key: K, value: AnalyzeRequest[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.review_text.trim().length < 10) {
      setError("Paste at least a short review (10+ characters) so the engine has text to inspect.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Analysis failed.");
      }
      saveResult(data as AnalyzeResponse, form);
      router.push("/analysis");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
      <div className="animate-fade-up mb-10 max-w-2xl">
        <span className="pill bg-butter/40 mb-4">
          <span className="h-2 w-2 rounded-full bg-butter" />
          12 forensic signals · seeded null model
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
          Inspect a review or listing before you trust it.
        </h1>
        <p className="mt-3 text-sm sm:text-base leading-relaxed muted max-w-xl">
          Paste review text and any listing context you have. The engine scores fraud,
          sabotage, content-authenticity and integrity signals, then explains the verdict
          in plain language.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <form onSubmit={submit} className="card card-hover animate-fade-up p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold tracking-tight">Case input</h2>
            <button
              type="button"
              onClick={() => setForm(SAMPLE)}
              className="btn-ghost !py-1.5 !px-3 !text-xs"
            >
              Load sample case
            </button>
          </div>

          <div className="mt-6">
            <label className="label" htmlFor="review_text">
              Review text
            </label>
            <textarea
              id="review_text"
              rows={6}
              className="input resize-y"
              placeholder="Paste the review body, product description, or listing text you want examined…"
              value={form.review_text}
              onChange={(e) => update("review_text", e.target.value)}
            />
            <p className="mt-1.5 text-xs muted">
              {form.review_text.trim().length} characters
            </p>
          </div>

          <div className="mt-6">
            <span className="label">Star rating</span>
            <div className="flex gap-2">
              {RATINGS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => update("rating", r)}
                  className={`flex h-11 flex-1 items-center justify-center rounded-2xl border text-sm font-bold transition ${
                    form.rating === r
                      ? "border-ink bg-ink text-canvas"
                      : "border-line bg-white text-ink-soft hover:border-ink/30"
                  }`}
                >
                  {r}★
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Toggle
              label="Verified purchase"
              hint="Unverified purchases add an integrity signal"
              value={form.verified_purchase === true}
              onChange={(v) => update("verified_purchase", v)}
            />
            <Toggle
              label="Review has image"
              hint="Images unlock the content-authenticity pathway"
              value={form.has_image === true}
              onChange={(v) => update("has_image", v)}
            />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="asin">Product ASIN (optional)</label>
              <input
                id="asin"
                className="input"
                placeholder="e.g. B07XJ8C1F5"
                value={form.asin}
                onChange={(e) => update("asin", e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="review_month">Review month (optional)</label>
              <input
                id="review_month"
                className="input"
                placeholder="YYYY-MM — used for burst detection"
                value={form.review_month}
                onChange={(e) => update("review_month", e.target.value)}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="mt-6 flex w-full items-center justify-between rounded-2xl border border-dashed border-line px-4 py-3 text-sm font-semibold text-ink-soft hover:border-ink/30 hover:text-ink transition"
          >
            Reviewer context {showAdvanced ? "▲" : "▼"}
            <span className="text-xs font-medium text-ink-faint">optional</span>
          </button>

          {showAdvanced && (
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label" htmlFor="rcount">Total reviews</label>
                <input
                  id="rcount"
                  type="number"
                  min={0}
                  className="input"
                  placeholder="e.g. 48"
                  value={form.reviewer_review_count ?? ""}
                  onChange={(e) =>
                    update("reviewer_review_count", e.target.value === "" ? null : Number(e.target.value))
                  }
                />
              </div>
              <div>
                <label className="label" htmlFor="rratio">Negative ratio</label>
                <input
                  id="rratio"
                  type="number"
                  step="0.01"
                  min={0}
                  max={1}
                  className="input"
                  placeholder="0.00 – 1.00"
                  value={form.reviewer_negative_ratio ?? ""}
                  onChange={(e) =>
                    update("reviewer_negative_ratio", e.target.value === "" ? null : Number(e.target.value))
                  }
                />
              </div>
              <div>
                <label className="label" htmlFor="rprod">Distinct products</label>
                <input
                  id="rprod"
                  type="number"
                  min={0}
                  className="input"
                  placeholder="e.g. 21"
                  value={form.reviewer_product_count ?? ""}
                  onChange={(e) =>
                    update("reviewer_product_count", e.target.value === "" ? null : Number(e.target.value))
                  }
                />
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 flex items-start gap-2 rounded-2xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm">
              <span className="mt-0.5 text-coral">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary mt-8 w-full !py-4">
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-canvas/40 border-t-canvas" />
                Running forensic scoring…
              </>
            ) : (
              <>
                Run forensic analysis
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </form>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <h3 className="text-sm font-bold tracking-tight">What the engine inspects</h3>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed muted">
              {[
                ["Evidence integrity", "Rating severity, complaint themes, image presence, verified status", "bg-sky"],
                ["Reviewer fraud", "Rating deviation, activity volume, negative behavior, multivariate anomaly", "bg-butter"],
                ["Coordinated sabotage", "Templated text repetition, posting-time bursts, reviewer-product network", "bg-lilac"],
                ["Content authenticity", "Perceptual-hash image reuse across listings (notebook pipeline)", "bg-coral"]
              ].map(([title, desc, dot]) => (
                <li key={title} className="flex gap-3">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
                  <span>
                    <span className="font-semibold text-ink">{title}.</span> {desc}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-bold tracking-tight">How to read the output</h3>
            <p className="mt-3 text-sm leading-relaxed muted">
              The score is an investigation-prioritization aid, not proof of fraud. A high
              score means several independent signals accumulated around one case. The
              likelihood badge compares the score against a seeded Monte-Carlo null model
              built from real population firing rates.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Toggle({
  label,
  hint,
  value,
  onChange
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition ${
        value ? "border-ink/20 bg-canvas" : "border-line bg-white"
      }`}
    >
      <span className="flex flex-col">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-[11px] muted">{hint}</span>
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          value ? "bg-ink" : "bg-line"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            value ? "left-[22px]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}
