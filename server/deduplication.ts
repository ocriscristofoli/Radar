import { Property, ListingSource } from '../src/types/index.ts';

export interface DuplicateMatchResult {
  isMatch: boolean;
  confidenceScore: number; // 0 to 100
  matchedPropertyId?: string;
  reasons: string[];
}

// Tokenize and clean text for n-gram / token comparison
function tokenize(str: string): Set<string> {
  const cleaned = str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ');
  
  const tokens = cleaned
    .split(/\s+/)
    .filter(t => t.length > 2 && !['com', 'para', 'dos', 'das', 'uma', 'seu', 'sua', 'que', 'por'].includes(t));
  return new Set(tokens);
}

function calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersectionCount++;
    }
  }
  const unionCount = setA.size + setB.size - intersectionCount;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

export function checkDuplicity(
  candidate: Partial<Property>,
  existingProperties: Property[]
): DuplicateMatchResult {
  let highestScore = 0;
  let bestMatch: Property | null = null;
  let bestReasons: string[] = [];

  for (const prop of existingProperties) {
    // If exact same ID, skip
    if (candidate.id && prop.id === candidate.id) continue;

    let score = 0;
    const reasons: string[] = [];

    // 1. City & Neighborhood check
    const sameCity = candidate.city && prop.city && candidate.city.toLowerCase() === prop.city.toLowerCase();
    const sameNeighborhood = candidate.neighborhood && prop.neighborhood && 
      candidate.neighborhood.toLowerCase().trim() === prop.neighborhood.toLowerCase().trim();

    if (!sameCity) {
      // Different cities cannot be duplicates
      continue;
    }
    score += 15;

    if (sameNeighborhood) {
      score += 15;
      reasons.push(`Mesmo bairro: ${prop.neighborhood}`);
    }

    // 2. Property type
    if (candidate.type && prop.type && candidate.type === prop.type) {
      score += 10;
    }

    // 3. Bedrooms match
    if (candidate.bedrooms !== undefined && prop.bedrooms !== undefined) {
      if (candidate.bedrooms === prop.bedrooms) {
        score += 15;
        reasons.push(`${prop.bedrooms} quartos idênticos`);
      } else {
        score -= 20; // different room counts significantly reduces likelihood
      }
    }

    // 4. Area match (tolerance within 5%)
    if (candidate.areaPrivate && prop.areaPrivate) {
      const areaDiff = Math.abs(candidate.areaPrivate - prop.areaPrivate);
      const tolerance = prop.areaPrivate * 0.06; // 6% margin
      if (areaDiff <= tolerance) {
        score += 25;
        reasons.push(`Área privativa muito próxima (${candidate.areaPrivate}m² vs ${prop.areaPrivate}m²)`);
      } else {
        score -= 15;
      }
    }

    // 5. Price deviation (within 15% range - sellers often adjust prices on different portals)
    if (candidate.price && prop.price) {
      const priceRatio = Math.abs(candidate.price - prop.price) / prop.price;
      if (priceRatio < 0.05) {
        score += 15;
        reasons.push(`Valores praticamente idênticos (R$ ${candidate.price.toLocaleString('pt-BR')} vs R$ ${prop.price.toLocaleString('pt-BR')})`);
      } else if (priceRatio < 0.15) {
        score += 8;
        reasons.push(`Diferença moderada de preço (${(priceRatio * 100).toFixed(0)}%)`);
      }
    }

    // 6. Textual title/description similarity
    const candidateTokens = tokenize(`${candidate.title || ''} ${candidate.description || ''}`);
    const propTokens = tokenize(`${prop.title} ${prop.description}`);
    const textSim = calculateJaccardSimilarity(candidateTokens, propTokens);
    if (textSim > 0.4) {
      score += 25;
      reasons.push(`Alta similaridade textual descritiva (${(textSim * 100).toFixed(0)}%)`);
    } else if (textSim > 0.25) {
      score += 12;
      reasons.push(`Similaridade textual moderada (${(textSim * 100).toFixed(0)}%)`);
    }

    // Normalize final score to 0 - 100
    const finalScore = Math.max(0, Math.min(100, score));

    if (finalScore > highestScore) {
      highestScore = finalScore;
      bestMatch = prop;
      bestReasons = reasons;
    }
  }

  // Threshold for duplicate detection is 70
  if (bestMatch && highestScore >= 70) {
    return {
      isMatch: true,
      confidenceScore: highestScore,
      matchedPropertyId: bestMatch.id,
      reasons: bestReasons,
    };
  }

  return {
    isMatch: false,
    confidenceScore: highestScore,
    matchedPropertyId: bestMatch?.id,
    reasons: bestReasons,
  };
}

// Merges a new listing source into an existing property, preserving original URLs, discovery dates, and recording price disparities
export function mergeDuplicateIntoProperty(
  existing: Property,
  newSource: ListingSource,
  candidateData?: Partial<Property>
): Property {
  // Check if source platform is already listed
  const alreadyHasSource = existing.sources.some(
    s => s.source === newSource.source && s.originalUrl === newSource.originalUrl
  );

  const updatedSources = alreadyHasSource ? existing.sources : [...existing.sources, newSource];

  // Keep track of price discrepancies if different
  return {
    ...existing,
    sources: updatedSources,
    originalPrice: existing.originalPrice || existing.price,
    updatedAt: new Date().toISOString(),
    tags: Array.from(new Set([...(existing.tags || []), 'Multifonte', `Visto em ${newSource.source}`])),
  };
}
