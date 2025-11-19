import { getClient } from './util/db.js';

const sql = getClient();

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    try {
        // Aqui pedimos explicitamente o campo filament_name
        const { rows } = await sql`
            SELECT user_name, description, grams_used, cost, timestamp, filament_name 
            FROM history 
            ORDER BY timestamp DESC LIMIT 100
        `;
        
        const history = rows.map(row => ({
            user: row.user_name,
            description: row.description,
            gramsUsed: row.grams_used,
            cost: parseFloat(row.cost),
            timestamp: row.timestamp,
            filamentName: row.filament_name || 'Desconhecido'
        }));

        return res.status(200).json(history);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}