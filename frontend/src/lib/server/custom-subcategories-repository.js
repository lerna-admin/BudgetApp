import crypto from "node:crypto";
import { query } from "./db";

export async function listCustomSubcategories() {
  const { rows } = await query(
    `SELECT id, category_label, name, edges, created_at
       FROM expense_custom_subcategories
       ORDER BY category_label, name`
  );
  return rows.map((row) => ({
    id: row.id,
    categoryLabel: row.category_label,
    name: row.name,
    edges: row.edges || [],
    createdAt: row.created_at,
  }));
}

export async function listCustomSubcategoriesByCategory(categoryLabel) {
  const { rows } = await query(
    `SELECT id, category_label, name, edges, created_at
       FROM expense_custom_subcategories
       WHERE LOWER(category_label) = LOWER($1)
       ORDER BY name`,
    [categoryLabel],
  );
  return rows.map((row) => ({
    id: row.id,
    categoryLabel: row.category_label,
    name: row.name,
    edges: row.edges || [],
    createdAt: row.created_at,
  }));
}

export async function createCustomSubcategory({ categoryLabel, name, edge }) {
  const id = crypto.randomUUID();
  const edges = edge ? [edge] : [];

  const { rows } = await query(
    `INSERT INTO expense_custom_subcategories (id, category_label, name, edges)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (LOWER(category_label), LOWER(name)) DO UPDATE
     SET edges = CASE WHEN expense_custom_subcategories.edges IS NULL OR cardinality(expense_custom_subcategories.edges)=0
                      THEN EXCLUDED.edges
                      ELSE expense_custom_subcategories.edges
                 END
     RETURNING id, category_label, name, edges, created_at`,
    [id, categoryLabel, name, edges],
  );

  return {
    id: rows[0].id,
    categoryLabel: rows[0].category_label,
    name: rows[0].name,
    edges: rows[0].edges || [],
    createdAt: rows[0].created_at,
  };
}
