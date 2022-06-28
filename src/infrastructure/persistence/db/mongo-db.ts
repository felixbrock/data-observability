import { Db, MongoClient, ServerApiVersion } from 'mongodb';
import { appConfig } from '../../../config';
import { IDb } from '../../../domain/services/i-db';

export default class MongoDb implements IDb {
  createClient = (): MongoClient =>
    new MongoClient(appConfig.mongodb.url, { serverApi: ServerApiVersion.v1 });

  connect = async (client: MongoClient): Promise<Db> => {
    await client.connect();
    return client.db(appConfig.mongodb.dbName);
  };

  close = async (client: MongoClient): Promise<void> => {
    await client.close();
  };
}
