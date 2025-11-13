import { getClient } from './util/db.js';
import { v4 as uuidv4 } from 'uuid';

const sql = getClient();

export default async function handler(req, res) {
    try {
        if (req.method === 'GET') {
            const { rows } = await sql`SELECT id, user_name, project_name, filament_id, grams_required, cost_per_kg FROM projects ORDER BY created_at DESC;`;
            return res.status(200).json(rows.map(row => ({
                id: row.id,
                user: row.user_name,
                projectName: row.project_name,
                filamentId: row.filament_id,
                gramsRequired: row.grams_required,
                costPerKg: parseFloat(row.cost_per_kg)
            })));
        }

        if (req.method === 'POST') {
            const { user, projectName, filamentId, gramsRequired, costPerKg, userId } = req.body;
            const newId = uuidv4();

            await sql`
                INSERT INTO projects (id, user_name, project_name, filament_id, grams_required, cost_per_kg, user_id)
                VALUES (${newId}, ${user}, ${projectName}, ${filamentId}, ${gramsRequired}, ${costPerKg}, ${userId});
            `;
            return res.status(201).json({ success: true, id: newId });
        }

        return res.status(405).json({ error: 'Método não permitido.' });

    } catch (error) {
        console.error("Erro no /api/projects:", error);
        return res.status(500).json({ error: error.message });
    }
}