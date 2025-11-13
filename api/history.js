import { getClient } from './util/db.js';

const sql = getClient();

export default async function handler(req, res) {
    if (req.method === 'GET') {
        try {
            // Busca os 10 mais recentes
            const { rows } = await sql`SELECT user_name, description, grams_used, cost, timestamp FROM history ORDER BY timestamp DESC LIMIT 10;`;
            
            return res.status(200).json(rows.map(row => ({
                user: row.user_name,
                description: row.description,
                gramsUsed: row.grams_used,
                cost: parseFloat(row.cost),
                timestamp: row.timestamp // Devolve a string ISO
            })));
        } catch (error) {
            console.error("Erro no /api/history:", error);
            return res.status(500).json({ error: error.message });
        }
    }
    
    return res.status(405).json({ error: 'Método não permitido.' });
}