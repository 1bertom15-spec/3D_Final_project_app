import { getClient } from '../util/db';
import { v4 as uuidv4 } from 'uuid';

const sql = getClient();

export default async function handler(req, res) {
    try {
        if (req.method === 'GET') {
            const { rows } = await sql`SELECT id, name, type, initial_kg, cost_per_kg, remaining_g FROM filaments ORDER BY remaining_g DESC;`;
            return res.status(200).json(rows.map(row => ({
                ...row,
                initial_kg: parseFloat(row.initial_kg),
                cost_per_kg: parseFloat(row.cost_per_kg),
            })));
        }

        if (req.method === 'POST') {
            const { name, type, initial_kg, cost_per_kg, userId } = req.body;
            const newId = uuidv4();
            const initialGrams = Math.round(initial_kg * 1000);

            await sql`
                INSERT INTO filaments (id, name, type, initial_kg, cost_per_kg, remaining_g, user_id)
                VALUES (${newId}, ${name}, ${type}, ${initial_kg}, ${cost_per_kg}, ${initialGrams}, ${userId});
            `;
            return res.status(201).json({ success: true, id: newId });
        }

        return res.status(405).json({ error: 'Método não permitido.' });

    } catch (error) {
        console.error("Erro no /api/filaments (index):", error);
        return res.status(500).json({ error: error.message });
    }
}