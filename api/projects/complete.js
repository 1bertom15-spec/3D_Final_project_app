import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { projectId } = req.body;

  try {
    // 1. Buscar o projeto
    const projectResult = await sql`SELECT * FROM projects WHERE id = ${projectId}`;
    if (projectResult.rows.length === 0) throw new Error("Projeto não encontrado");
    const project = projectResult.rows[0];

    // Lógica para suportar projetos novos (lista) e antigos (legacy)
    let items = project.materials;
    
    // Fallback: Se for projeto antigo, converte para o formato novo
    if (!items || items.length === 0) {
        items = [{ filamentId: project.filament_id, grams: project.grams_required }];
    }

    let totalCost = 0;
    let totalGrams = 0;
    let descriptionParts = [];

    // 2. Loop por cada filamento usado
    for (const item of items) {
      if(!item.filamentId) continue;

      // Buscar dados ATUAIS da bobine
      const fResult = await sql`SELECT * FROM filaments WHERE id = ${item.filamentId}`;
      
      if (fResult.rows.length > 0) {
        const filament = fResult.rows[0];
        const grams = parseFloat(item.grams);

        // Custo proporcional
        const itemCost = (filament.cost_per_kg / 1000) * grams;
        
        totalCost += itemCost;
        totalGrams += grams;
        descriptionParts.push(`${filament.name} (${grams}g)`);

        // DESCONTAR STOCK
        await sql`
          UPDATE filaments 
          SET remaining_g = remaining_g - ${grams}
          WHERE id = ${item.filamentId}
        `;
      } else {
        descriptionParts.push(`Bobine Apagada (${item.grams}g)`);
      }
    }

    const finalDescription = `${project.project_name} [${descriptionParts.join(', ')}]`;

    // 3. Mover para o Histórico
    await sql`
      INSERT INTO history (id, "user", description, grams_used, cost, date, materials)
      VALUES (
        ${project.id}, 
        ${project.user}, 
        ${finalDescription}, 
        ${totalGrams}, 
        ${totalCost}, 
        NOW(),
        ${JSON.stringify(items)}
      )
    `;

    // 4. Apagar da Fila
    await sql`DELETE FROM projects WHERE id = ${projectId}`;

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}