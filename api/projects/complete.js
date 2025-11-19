import { getClient } from '../util/db.js';
import { v4 as uuidv4 } from 'uuid';

const sql = getClient();

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    const { projectId } = req.body;
    if (!projectId) return res.status(400).json({ error: 'Project ID required' });

    try {
        // 1. Buscar Projeto
        const pRes = await sql`SELECT * FROM projects WHERE id = ${projectId}`;
        if (pRes.rows.length === 0) return res.status(404).json({ error: 'Projeto não encontrado' });
        const proj = pRes.rows[0];

        // 2. Buscar Filamento
        const fRes = await sql`SELECT * FROM filaments WHERE id = ${proj.filament_id}`;
        
        // CORREÇÃO IMPORTANTE:
        // Se a bobina foi apagada, apagamos o projeto e avisamos, mas não crashamos.
        if (fRes.rows.length === 0) {
            await sql`DELETE FROM projects WHERE id = ${projectId}`;
            return res.status(404).json({ error: 'A bobina original foi apagada. O projeto foi removido.' });
        }

        const fil = fRes.rows[0];
        const newStock = fil.remaining_g - proj.grams_required;
        
        if (newStock < 0) return res.status(400).json({ error: `Stock insuficiente (${fil.remaining_g}g)` });

        const cost = (proj.grams_required / 1000) * parseFloat(proj.cost_per_kg);

        // 3. Atualizar Stock
        await sql`UPDATE filaments SET remaining_g = ${newStock} WHERE id = ${fil.id}`;

        // 4. Guardar no Histórico (COM NOME DO FILAMENTO)
        await sql`
            INSERT INTO history (id, user_name, description, grams_used, cost, filament_name)
            VALUES (${uuidv4()}, ${proj.user_name}, ${proj.project_name}, ${proj.grams_required}, ${cost}, ${fil.name})
        `;

        // 5. Remover Pendente
        await sql`DELETE FROM projects WHERE id = ${projectId}`;

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
}