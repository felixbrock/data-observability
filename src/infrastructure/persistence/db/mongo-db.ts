import { Db, MongoClient, ServerApiVersion } from 'mongodb';
import { appConfig } from '../../../config';

export default class Dbo {
	#client = new MongoClient(appConfig.mongodb.url, {
		serverApi: ServerApiVersion.v1,
	});
	
	#dbConnection: Db | undefined;

	get dbConnection(): Db {
		if(!this.#dbConnection) throw Error('Undefined db connection. Please connect to server first');
		return this.#dbConnection;
	}

	connectToServer = (callback: (err?: any) => any): any => {
    this.#client.connect((err, db) =>  {
      if (err || !db) {
        return callback(err);
      }

      this.#dbConnection = db.db(appConfig.mongodb.dbName);
      console.log('Successfully connected to MongoDB.');

      return callback();
    });
  };

};


// const getClient = (): MongoClient =>


// export const routerDbConnection = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): void => {
//   getClient()
//     .connect()
//     .then((connectedClient) => {
//       // req.db = connectedClient.db(appConfig.mongodb.dbName);
//       req.db = connectedClient;
//       next();
//     })
//     .catch((err) => next(err));
// };

// export const cronJobDbConnection = async (): Promise<Db> => {
//   const connectedClient = await getClient().connect();
//   return connectedClient.db(appConfig.mongodb.dbName);
// };
