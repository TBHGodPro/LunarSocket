import { Express } from 'express';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import logger from '../utils/logger';

export default async function registerRoutes(app: Express): Promise<void> {
  const routes = await readdir(join(__dirname, 'routes'));

  for (const route of routes) {
    app.use(
      route === 'dashboard.js'
        ? '/dashboard'
        : `/api/${route.replace('.js', '')}`,
      (await import(join(__dirname, 'routes', route))).default
    );
  }

  logger.log(`Registered ${routes.length} Routes`);

  app.get('/', (request, response) => response.sendStatus(200));
}
