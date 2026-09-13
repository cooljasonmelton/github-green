const CULTURE_TERMS = Object.freeze([
  'album',
  'book',
  'comedy',
  'comedian',
  'film',
  'game',
  'music',
  'novel',
  'premiere',
  'released',
  'series',
  'song',
  'television',
  'tv',
]);

function hasWords(value, minimum) {
  return typeof value === 'string' && value.trim().split(/\s+/).length >= minimum;
}

function isCandidate(candidate) {
  return Number.isInteger(candidate?.year)
    && hasWords(candidate.text, 7)
    && hasWords(candidate.title, 1)
    && hasWords(candidate.description, 2)
    && typeof candidate.sourceUrl === 'string'
    && candidate.sourceUrl.startsWith('https://');
}

function tieBreakerIndex(date, length) {
  const timestamp = Date.parse(`${date}T00:00:00.000Z`);
  const day = Number.isNaN(timestamp) ? 0 : Math.floor(timestamp / 86_400_000);

  return ((day % length) + length) % length;
}

function selectHighestScoring(candidates, date, score) {
  const scored = (Array.isArray(candidates) ? candidates : [])
    .filter(isCandidate)
    .map((candidate) => ({ candidate, score: score(candidate) }))
    .filter(({ score: candidateScore }) => candidateScore > 0);

  if (scored.length === 0) {
    return null;
  }

  const highestScore = Math.max(...scored.map(({ score: candidateScore }) => candidateScore));
  const strongest = scored
    .filter(({ score: candidateScore }) => candidateScore === highestScore)
    .map(({ candidate }) => candidate);

  return strongest[tieBreakerIndex(date, strongest.length)];
}

function historyScore(candidate) {
  const textLength = candidate.text.trim().length;
  const descriptionWords = candidate.description.trim().split(/\s+/).length;

  return (textLength >= 45 && textLength <= 260 ? 2 : 0)
    + (descriptionWords >= 3 ? 1 : 0);
}

function cultureScore(candidate) {
  const content = `${candidate.text} ${candidate.title} ${candidate.description}`.toLowerCase();
  const matchedTerms = CULTURE_TERMS.filter((term) => {
    const expression = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return expression.test(content);
  });

  return matchedTerms.length;
}

function isPhoto(photo) {
  return ['title', 'imageUrl', 'caption', 'creator', 'credit', 'license', 'licenseUrl', 'sourceUrl']
    .every((key) => typeof photo?.[key] === 'string' && photo[key].trim());
}

export function selectHistoricalEvent(candidates, date) {
  return selectHighestScoring(candidates, date, historyScore);
}

export function selectBirthday(candidates, date) {
  const candidate = selectHighestScoring(candidates, date, historyScore);

  return candidate && {
    name: candidate.title,
    birthYear: candidate.year,
    knownFor: candidate.description,
    sourceUrl: candidate.sourceUrl,
  };
}

export function selectCultureEvent(candidates, date) {
  return selectHighestScoring(candidates, date, cultureScore);
}

export function selectPhoto(photo) {
  return isPhoto(photo) ? { ...photo } : null;
}
