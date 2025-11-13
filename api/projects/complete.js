import { getClient } from '../util/db';
import { v4 as uuidv4 } from 'uuid';

const sql = getClient();

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido.' });
    }
    
    const { projectId } = req.body;
    
    if (!projectId) {
        return res.status(400).json({ error: 'Project ID é obrigatório.' });
    }

    let projectDoc, filamentDoc;
    
    try {
        // 1. Obter dados do projeto
        const projectResult = await sql`SELECT * FROM projects WHERE id = ${projectId};`;
        if (projectResult.rows.length === 0) {
            return res.status(404).json({ error: 'Projeto não encontrado.' });
        }
        projectDoc = projectResult.rows[0];

        const filamentId = projectDoc.filament_id;
        const gramsUsed = projectDoc.grams_required;
        const costPerKg = parseFloat(projectDoc.cost_per_kg);
        const user = projectDoc.user_name;
        const projectName = projectDoc.project_name;
        
        // 2. Obter dados do filamento
        const filamentResult = await sql`SELECT * FROM filaments WHERE id = ${filamentId};`;
        if (filamentResult.rows.length === 0) {
            // Se o filamento foi apagado, limpamos o projeto órfão
            await sql`DELETE FROM projects WHERE id = ${projectId};`;
            return res.status(404).json({ error: 'Filamento associado não encontrado.' });
        }
        filamentDoc = filamentResult.rows[0];

        const currentRemainingG = filamentDoc.remaining_g;
        const newRemainingG = currentRemainingG - gramsUsed;
        
        if (newRemainingG < 0) {
            return res.status(400).json({ error: `Stock insuficiente! Apenas ${currentRemainingG}g restantes.` });
        }

        // 3. Calcular custo
        const cost = (gramsUsed / 1000) * costPerKg;
        
        // --- Transação ---
        
        // 4. Atualizar o stock do filamento
        await sql`
            UPDATE filaments
            SET remaining_g = ${newRemainingG}
            WHERE id = ${filamentId};
        `;
        
        // 5. Adicionar registo ao histórico
        const historyId = uuidv4();
        await sql`
            INSERT INTO history (id, user_name, description, grams_used, cost)
            VALUES (${historyId}, ${user}, ${projectName}, ${gramsUsed}, ${cost});
        `;
        
        // 6. Apagar o projeto pendente
        await sql`DELETE FROM projects WHERE id = ${projectId};`;

        return res.status(200).json({ 
            success: true, 
            projectName,
            gramsUsed,
            cost: cost.toFixed(2)
        });

    } catch (error) {
        // Se algo falhar (ex: atualização de filamento), nada é apagado ou inserido (dependendo do erro)
        console.error("Erro ao concluir projeto:", error);
        return res.status(500).json({ error: error.message });
    }
}