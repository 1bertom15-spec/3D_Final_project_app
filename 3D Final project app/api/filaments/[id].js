import { getClient } from '../util/db';

const sql = getClient();

export default async function handler(req, res) {
    try {
        if (req.method === 'DELETE') {
            // O Vercel Router coloca o valor de [id] em req.query.id
            const { id } = req.query; 
            
            if (!id) {
                return res.status(400).json({ error: 'Filament ID é obrigatório.' });
            }

            // A constraint ON DELETE CASCADE (que definiremos no SQL)
            // irá apagar os projetos associados
            const { rowCount } = await sql`DELETE FROM filaments WHERE id = ${id} RETURNING id;`;
            
            if (rowCount === 0) {
                 return res.status(404).json({ error: 'Filamento não encontrado.' });
            }

            return res.status(200).json({ success: true, message: "Filamento e projetos associados eliminados." });
        }

        return res.status(405).json({ error: 'Método não permitido.' });

    } catch (error) {
        console.error("Erro no /api/filaments/[id]:", error);
        return res.status(500).json({ error: error.message });
    }
}