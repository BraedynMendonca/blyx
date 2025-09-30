export function summarizeText(input) {
  const clean = input.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const sentences = clean
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  if (sentences.length === 0) return [clean];
  const maxBullets = Math.min(5, Math.max(3, Math.ceil(sentences.length / 3)));
  const step = Math.max(1, Math.floor(sentences.length / maxBullets));
  const bullets = [];
  for (let i = 0; i < sentences.length && bullets.length < maxBullets; i += step) {
    bullets.push(sentences[i]);
  }
  return bullets;
}
