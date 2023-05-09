import { Db, MongoClient, ServerApiVersion } from 'mongodb';
import { appConfig } from '../../../config';

export default class Dbo {
  #client = new MongoClient(appConfig.mongodb.url, {
    serverApi: ServerApiVersion.v1,
  });

  #dbConnection: Db | undefined;

  get dbConnection(): Db {
    if (!this.#dbConnection)
      throw Error('Undefined db connection. Please connect to server first');
    return this.#dbConnection;
  }

  connectToServer = async (): Promise<void> => {
    const db = await this.#client.connect();

    this.#dbConnection = db.db(appConfig.mongodb.dbName);
    console.log('Successfully connected to MongoDB.');
  };
}