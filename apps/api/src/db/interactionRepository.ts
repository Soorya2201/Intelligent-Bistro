import db from './database';

export type InteractionType = 'viewed' | 'added' | 'removed' | 'reordered' | 'liked';

export function recordInteraction(sessionId: string, itemId: string, type: InteractionType) {
  db.prepare(`
    INSERT INTO item_interactions (session_id, item_id, interaction_type)
    VALUES (?, ?, ?)
  `).run(sessionId, itemId, type);
}

export function getSessionInteractions(sessionId: string) {
  return db.prepare(`
    SELECT item_id, interaction_type, COUNT(*) as count
    FROM item_interactions
    WHERE session_id = ?
    GROUP BY item_id, interaction_type
    ORDER BY count DESC
  `).all(sessionId) as Array<{ item_id: string; interaction_type: string; count: number }>;
}

export function getGlobalPopularity() {
  return db.prepare(`
    SELECT item_id, COUNT(*) as add_count
    FROM item_interactions
    WHERE interaction_type = 'added'
    GROUP BY item_id
    ORDER BY add_count DESC
    LIMIT 10
  `).all() as Array<{ item_id: string; add_count: number }>;
}
