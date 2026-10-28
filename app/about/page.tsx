import Link from "next/link";

const STEPS = [
  {
    step: "01",
    title: "Population baseline",
    body: "60,000 one- and two-star Electronics reviews from the public McAuley-Lab Amazon Reviews 2023 release are normalized and used to establish firing rates for every signal.",
    color: "bg-sky"
  },
  {
    step: "02",
    title: "12 evidence components",
    body: "Each case is scored across rating severity, complaint themes, image evidence, purchase verification, rating deviation, reviewer activity, negative behavior, text repetition, temporal bursts, network reach, anomaly, and image reuse.",
    color: "bg-butter"
  },
  {
    step: "03",
    title: "Seeded null model",
    body: "A Monte-Carlo simulation draws the expected score if those signals fired independently, producing a surprise p-value and a likelihood-strength band. Seeds are fixed so results are reproducible.",
    color: "bg-lilac"
  },
  {
    step: "04",
    title: "Ordered verdict cascade",
    body: "A fixed rule order maps the fired components to a verdict: content authenticity, then coordinated sabotage, then reviewer fraud, then authentic complaint, else routine.",
    color: "bg-coral"
  }
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:py-16">
      <div className="animate-fade-up max-w-2xl">
        <span className="pill bg-sage/40 mb-4">
          <span className="h-2 w-2 rounded-full bg-sage" />
          Methodology
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
          How the forensic scoring works
        </h1>
        <p className="mt-4 text-sm sm:text-base leading-relaxed muted">
          The engine turns review metadata and text into an investigation-prioritization score,
          then explains the verdict in plain language. It reuses the exact rules and thresholds
          exported by the offline notebook so web results match the analysis one-to-one.
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {STEPS.map((s) => (
          <div key={s.step} className="card card-hover animate-fade-up p-6">
            <div className="flex items-center gap-3">
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold ${s.color}`}>
                {s.step}
              </span>
              <h2 className="text-sm font-bold tracking-tight">{s.title}</h2>
            </div>
            <p className="mt-4 text-sm leading-relaxed muted">{s.body}</p>
          </div>
        ))}
      </div>

      <div className="card animate-fade-up mt-10 p-6 sm:p-8">
        <h2 className="text-lg font-bold tracking-tight">Important limitations</h2>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed muted">
          <li className="flex gap-3">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ink" />
            A high score means several signals clustered around one case. It is not proof that a
            review is fake, fraudulent, or coordinated.
          </li>
          <li className="flex gap-3">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ink" />
            Genuine product problems — a defective batch or a sudden price change — can produce the
            same signals as manipulation.
          </li>
          <li className="flex gap-3">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ink" />
            Image reuse detection runs in the notebook pipeline over downloaded review images; the
            web form reports it as a pipeline capability rather than re-hashing on the client.
          </li>
          <li className="flex gap-3">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ink" />
            Reviewer-context fields are optional. Without them, the corresponding components are
            simply not assessed and the score reflects only the available evidence.
          </li>
        </ul>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Link href="/" className="btn-primary">
          Analyze a review
        </Link>
        <Link href="/dashboard" className="btn-ghost">
          View the full dashboard
        </Link>
      </div>
    </div>
  );
}
