import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { PostgresAdapter } from "../adapter-postgres/adapter-postgres";

export class DrizzleNodePostgresAdapter extends PostgresAdapter {
  constructor(drizzleDb: NodePgDatabase) {
    super((drizzleDb as any).$client);
  }
}
