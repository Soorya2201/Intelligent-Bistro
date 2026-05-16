import db from './database';
import menuData from '../data/menu.json';

export function seedMenu() {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO menu_items
      (id, name, description, price, category, image_url, allergens, tags, pairings, calories, popular, available)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  const insertMany = db.transaction(() => {
    for (const category of menuData.categories) {
      for (const item of category.items as any[]) {
        insert.run(
          item.id,
          item.name,
          item.description || '',
          item.price,
          item.category || category.id,
          item.image || '',
          JSON.stringify(item.allergens || []),
          JSON.stringify(item.tags || item.dietary || []),
          JSON.stringify(item.pairings || []),
          item.calories || null,
          item.popular ? 1 : 0,
        );
      }
    }
  });

  insertMany();
}
