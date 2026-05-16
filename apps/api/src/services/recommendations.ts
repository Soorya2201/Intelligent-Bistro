import { getAllMenuItems, getMenuItemById } from '../db/menuRepository';
import { getGlobalPopularity, getSessionInteractions } from '../db/interactionRepository';

const cartFingerprints = new Map<string, string>();

function fingerprint(itemIds: string[]): string {
  return [...itemIds].sort().join(',');
}

export function shouldSkipRecommendations(sessionId: string, cartItemIds: string[]): boolean {
  const fp = fingerprint(cartItemIds);
  if (cartFingerprints.get(sessionId) === fp) return true;
  cartFingerprints.set(sessionId, fp);
  return false;
}

interface RecommendationSources {
  popularity: number;
  affinity: number;
  pairing: number;
  dietary: number;
}

function computeScore(sources: RecommendationSources): number {
  if (sources.dietary === 0) return 0;
  return (
    sources.popularity * 0.25 +
    sources.affinity   * 0.35 +
    sources.pairing    * 0.25 +
    sources.dietary    * 0.15
  );
}

export async function getRecommendations(
  sessionId: string,
  cartItemIds: string[],
  dietaryRestrictions: string[] = [],
  count = 3,
) {
  const allItems = getAllMenuItems();
  const cartSet  = new Set(cartItemIds);

  const candidates = allItems.filter(item => !cartSet.has(item.id));
  if (!candidates.length) return [];

  // Source 1: popularity
  const popularityRows = getGlobalPopularity();
  const maxPop = popularityRows[0]?.add_count || 1;
  const popularityMap: Record<string, number> = {};
  for (const row of popularityRows) {
    popularityMap[row.item_id] = row.add_count / maxPop;
  }

  // Source 2: session affinity
  const interactions = getSessionInteractions(sessionId);
  const affinityMap: Record<string, number> = {};
  for (const row of interactions) {
    if (row.interaction_type === 'added' || row.interaction_type === 'reordered') {
      affinityMap[row.item_id] = Math.min(1, (affinityMap[row.item_id] || 0) + row.count * 0.3);
    } else if (row.interaction_type === 'liked') {
      affinityMap[row.item_id] = Math.min(1, (affinityMap[row.item_id] || 0) + row.count * 0.5);
    }
  }

  // Source 3: pairing
  const pairingSet = new Set<string>();
  for (const cartId of cartItemIds) {
    const item = getMenuItemById(cartId);
    if (item) item.pairings.forEach((p: string) => pairingSet.add(p));
  }

  // Source 4: dietary compatibility
  const restrictionTags = new Set(dietaryRestrictions.map(r => r.toLowerCase()));

  const scored = candidates.map(item => {
    // Dietary: hard exclude if item has conflicting allergens/tags
    let dietary = 1;
    if (restrictionTags.size > 0) {
      const itemTags = new Set((item.tags || []).map((t: string) => t.toLowerCase()));
      for (const restriction of restrictionTags) {
        if (restriction === 'vegan' && !itemTags.has('vegan')) dietary = 0.5;
        if (restriction === 'gluten-free' && !itemTags.has('gluten-free')) dietary = 0.5;
        if (restriction === 'vegetarian' && !itemTags.has('vegetarian') && !itemTags.has('vegan')) dietary = 0.5;
      }
    }

    const sources: RecommendationSources = {
      popularity: popularityMap[item.id] || (item.popular ? 0.6 : 0.1),
      affinity:   Math.min(1, affinityMap[item.id] || 0),
      pairing:    pairingSet.has(item.id) ? 1 : 0,
      dietary,
    };

    const score = computeScore(sources);

    let sourceLabel = 'Popular';
    if (sources.pairing > 0)         sourceLabel = 'pairing+popularity';
    else if (sources.affinity > 0.3) sourceLabel = 'affinity';
    else if (sources.popularity > 0.5) sourceLabel = 'popularity';

    let reason = 'Popular with your order';
    if (sources.pairing > 0)         reason = 'Pairs well with your order';
    else if (sources.affinity > 0.3) reason = "You've ordered this before";

    return { item, score, source: sourceLabel, reason };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(s => ({
      item_id:   s.item.id,
      name:      s.item.name,
      price:     s.item.price,
      image:     s.item.image,
      reason:    s.reason,
      score:     Math.round(s.score * 100) / 100,
      source:    s.source,
    }));
}
