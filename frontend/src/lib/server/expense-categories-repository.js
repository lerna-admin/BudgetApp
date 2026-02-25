import { query } from "./db";

export async function listCategoriesWithSubcategories() {
  const { rows } = await query(
    `SELECT c.id AS category_id, c.name AS category_name, c.bucket, c.type, c.icon,
            s.id AS subcategory_id, s.name AS subcategory_name, s.edges
       FROM expense_categories c
       LEFT JOIN expense_subcategories s ON s.category_id = c.id
      ORDER BY c.bucket, c.name, s.name`
  );

  const map = new Map();

  for (const row of rows) {
    if (!map.has(row.category_id)) {
      map.set(row.category_id, {
        id: row.category_id,
        name: row.category_name,
        bucket: row.bucket,
        type: row.type,
        icon: row.icon,
        subcategories: [],
      });
    }

    if (row.subcategory_id) {
      map.get(row.category_id).subcategories.push({
        id: row.subcategory_id,
        name: row.subcategory_name,
        edges: row.edges || [],
      });
    }
  }

  return Array.from(map.values());
}
