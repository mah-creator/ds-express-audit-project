import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load the auto-generated swagger document
const swaggerSpec = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../swagger-output.json'), 'utf8')
);

export const setupSwagger = (app: Express) => {
  app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  
  // Expose the raw JSON schema
  app.get('/swagger.json', (req, res) => {
    res.json(swaggerSpec);
  });
};
