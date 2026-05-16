import { SuggestedItem } from '../types';

interface MenuEntry {
  id: string;
  name: string;
  price: number;
  image: string;
}

export function extractMenuMentions(
  text: string,
  menu: MenuEntry[],
): SuggestedItem[] {
  // Strip common markdown punctuation so "**Wagyu Smash Burger**" still matches
  const plain = text.replace(/[*_~`#>]/g, '').toLowerCase();

  const seen = new Set<string>();
  const found: SuggestedItem[] = [];

  for (const item of menu) {
    if (seen.has(item.id)) continue;
    if (plain.includes(item.name.toLowerCase())) {
      seen.add(item.id);
      found.push({ id: item.id, name: item.name, price: item.price, image: item.image });
    }
  }

  return found;
}
