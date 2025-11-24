import { sql } from '@vercel/postgres';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  // GET: Lista os projetos na tabela
  if (req.method === 'GET') {
    try {
      const { rows } = await sql`SELECT * FROM projects ORDER BY date_created DESC`;
      return res.status(200).json(rows);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // POST: Cria novo projeto com a lista de materiais
  if (req.method === 'POST') {
    try {
      const { user, projectName, materials } = req.body;
      const id = uuidv4();
      
      // Se vier vazio, garante que é um array vazio
      const matList = materials || [];

      await sql`
        INSERT INTO projects (id, "user", project_name, materials, date_created)
        VALUES (${id}, ${user}, ${projectName}, ${JSON.stringify(matList)}, NOW())
      `;

      return res.status(201).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}