export type DbClient = any;

export type DbConnection = any;

export interface IDb {
  createClient(): DbClient;
  connect(client: DbClient): Promise<DbConnection>;
  close(client: DbClient): Promise<void>;
}
