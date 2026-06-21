import { migrate } from "../lib/db/migrate.ts";
import { getDbPath } from "../lib/db/connection.ts";

const tables = migrate();
console.log(`✓ migrated ${getDbPath()}`);
console.log(`  tables: ${tables.join(", ")}`);
