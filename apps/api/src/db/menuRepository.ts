import db from './database';

interface DbMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  allergens: string;
  tags: string;
  pairings: string;
  calories: number | null;
  popular: number;
  available: number;
}

function parseItem(row: DbMenuItem) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    category: row.category,
    image: row.image_url,
    allergens: JSON.parse(row.allergens || '[]'),
    tags: JSON.parse(row.tags || '[]'),
    pairings: JSON.parse(row.pairings || '[]'),
    calories: row.calories,
    popular: row.popular === 1,
    available: row.available === 1,
  };
}

export function getAllMenuItems() {
  const rows = db.prepare(`
    SELECT * FROM menu_items WHERE available = 1 ORDER BY category, name
  `).all() as DbMenuItem[];
  return rows.map(parseItem);
}

export function getMenuItemById(id: string) {
  const row = db.prepare(`SELECT * FROM menu_items WHERE id = ?`).get(id) as DbMenuItem | undefined;
  return row ? parseItem(row) : null;
}

export function getMenuByCategory(category: string) {
  const rows = db.prepare(`
    SELECT * FROM menu_items WHERE category = ? AND available = 1
  `).all(category) as DbMenuItem[];
  return rows.map(parseItem);
}

export function getMenuAsCategories() {
  const items = getAllMenuItems();
  const categoryMap: Record<string, { id: string; name: string; items: ReturnType<typeof parseItem>[] }> = {};
  const categoryOrder = ['starters', 'mains', 'sides', 'drinks', 'desserts'];

  for (const item of items) {
    if (!categoryMap[item.category]) {
      categoryMap[item.category] = {
        id: item.category,
        name: item.category.charAt(0).toUpperCase() + item.category.slice(1),
        items: [],
      };
    }
    categoryMap[item.category].items.push(item);
  }

  return categoryOrder
    .filter(c => categoryMap[c])
    .map(c => categoryMap[c]);
}

export function getPopularItems(limit = 10) {
  const rows = db.prepare(`
    SELECT * FROM menu_items WHERE popular = 1 AND available = 1 LIMIT ?
  `).all(limit) as DbMenuItem[];
  return rows.map(parseItem);
}
