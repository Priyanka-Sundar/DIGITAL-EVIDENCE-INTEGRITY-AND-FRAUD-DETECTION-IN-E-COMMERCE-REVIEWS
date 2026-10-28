const COMPLAINT_DICTIONARY: Record<string, string[]> = {
  quality: ["broken", "defective", "poor quality", "damaged", "stopped working", "not working", "faulty", "dead", "cheap"],
  delivery: ["late", "delivery", "arrived late", "not delivered", "missing package", "shipping", "shipment"],
  seller: ["seller", "scam", "fake", "counterfeit", "wrong item", "fraud"],
  refund: ["refund", "return", "replacement", "money back", "customer service"],
  performance: ["slow", "overheating", "battery", "disconnect", "crash", "lag", "does not work", "doesn't work"],
  appearance: ["different color", "scratched", "stain", "smell", "looks used", "not as described"]
};

const STOPWORDS = new Set([
  "the", "and", "for", "are", "but", "not", "you", "all", "can", "was", "were", "this",
  "that", "with", "have", "has", "had", "they", "them", "their", "there", "would", "could",
  "should", "from", "your", "about", "into", "just", "very", "when", "what", "which", "who",
  "how", "why", "been", "being", "than", "then", "these", "those", "out", "get", "got", "its",
  "our", "one", "two", "after", "before", "because", "while", "were", "will", "shall", "may",
  "might", "must", "also", "some", "such", "only", "over", "under", "again", "still", "even"
]);

export function detectCategories(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const [category, terms] of Object.entries(COMPLAINT_DICTIONARY)) {
    if (terms.some((term) => lower.includes(term))) {
      found.push(category);
    }
  }
  return found;
}

export function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s']/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
  return new Set(words);
}

export interface PhraseMatch {
  similarity: number;
  occurrences: number;
  distinctProducts: number;
  excerpt: string;
}

export function matchTemplatedPhrases(
  text: string,
  phrases: { text: string; occurrences: number; distinct_products: number }[]
): PhraseMatch | null {
  const reviewTokens = tokenize(text);
  if (reviewTokens.size === 0) return null;
  let best: PhraseMatch | null = null;
  for (const phrase of phrases) {
    const phraseTokens = tokenize(phrase.text);
    if (phraseTokens.size === 0) continue;
    let overlap = 0;
    for (const token of phraseTokens) {
      if (reviewTokens.has(token)) overlap += 1;
    }
    const dice = (2 * overlap) / (phraseTokens.size + reviewTokens.size);
    if (best === null || dice > best.similarity) {
      best = {
        similarity: dice,
        occurrences: phrase.occurrences,
        distinctProducts: phrase.distinct_products,
        excerpt: phrase.text.slice(0, 140)
      };
    }
  }
  return best;
}

function logGamma(x: number): number {
  const cofactors = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5
  ];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j += 1) {
    ser += cofactors[j] / ++y;
  }
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

function gammaSeries(a: number, x: number): number {
  if (x <= 0) return 0;
  let ap = a;
  let sum = 1 / a;
  let del = sum;
  for (let n = 0; n < 300; n += 1) {
    ap += 1;
    del *= x / ap;
    sum += del;
    if (Math.abs(del) < Math.abs(sum) * 1e-12) break;
  }
  return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
}

function gammaContinuedFraction(a: number, x: number): number {
  const FPMIN = 1e-300;
  let b = x + 1 - a;
  let c = 1 / FPMIN;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i <= 300; i += 1) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-12) break;
  }
  return Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
}

export function regularizedGammaP(a: number, x: number): number {
  if (x < 0 || a <= 0) return 0;
  if (x === 0) return 0;
  if (x < a + 1) return gammaSeries(a, x);
  return 1 - gammaContinuedFraction(a, x);
}

export function chiSquareCdf(value: number, degreesOfFreedom: number): number {
  if (value <= 0) return 0;
  return regularizedGammaP(degreesOfFreedom / 2, value / 2);
}

export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
