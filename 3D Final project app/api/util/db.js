import { sql } from '@vercel/postgres';
import { v4 as uuidv4 } from 'uuid';

export const getClient = () => {
    return sql;
};

// (Nota: A função setupDatabase() que estava aqui não é necessária 
// se fizermos a configuração manual, como recomendado.)