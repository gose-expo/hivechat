import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

import { llmModels, users, llmSettingsTable, appSettings, groups, groupModels, mcpServers, usageReport, mcpTools, searchEngineConfig, bots } from './schema'
import * as relations from './relations';

const schema = { users, llmModels, llmSettingsTable, appSettings, groups, groupModels, mcpServers, usageReport, mcpTools, searchEngineConfig, bots, ...relations };

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });