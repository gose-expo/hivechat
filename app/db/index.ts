import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

import { llmModels, users, llmSettingsTable, appSettings, groups, groupModels, mcpServers, usageReport, mcpTools, searchEngineConfig, bots } from './schema'
import * as relations from './relations';

const schema = { users, llmModels, llmSettingsTable, appSettings, groups, groupModels, mcpServers, usageReport, mcpTools, searchEngineConfig, bots, ...relations };

// Lazy initialization to avoid build-time errors when DATABASE_URL is not available
let _db: NeonHttpDatabase<typeof schema> | null = null;

export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_target, prop) {
    if (!_db) {
      const sql = neon(process.env.DATABASE_URL!);
      _db = drizzle(sql, { schema });
    }
    return (_db as any)[prop];
  }
});