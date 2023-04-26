import { Db, MongoClient, ServerApiVersion } from 'mongodb';
import genericPool, { Pool } from 'generic-pool';
import { appConfig } from '../../../config';

export default class Dbo {	
	#dbConnection?: Db;
	
	#mongoClient: MongoClient;
	
	#mongoPool: Pool<MongoClient>;

	constructor() {
		this.#mongoClient = new MongoClient(appConfig.mongodb.url, {
			serverApi: ServerApiVersion.v1,
			maxPoolSize: 10,
			socketTimeoutMS: 30000,
			connectTimeoutMS: 30000,
		});

		const factory = {
			create: async () => {
			  await this.#mongoClient.connect();
			  console.log('MongoDB client connected');
			  return this.#mongoClient;
			},

			destroy: async (client: any) => {
			  await client.close();
			  console.log('MongoDB client disconnected');
			}
		};

		const opts = {
			max: 10,
			min: 1,
			idleTimeoutMillis: 30000,
		};
		
		this.#mongoPool = genericPool.createPool(factory, opts);
	}

	get dbConnection(): Db {
		if(!this.#dbConnection) throw Error('Undefined db connection. Please connect to server first');
		return this.#dbConnection;
	}

	connectToServer = async (): Promise<void> => {
		try {
			const conn = await this.#mongoPool.acquire();
			const db = conn.db(appConfig.mongodb.dbName);

			this.#dbConnection = db;
			console.log('Successfully connected to MongoDB.');
		} catch (err) {
			console.log('Failed to acquire client from pool', err);
			throw err;
		}
	};

	releaseConnections = async (): Promise<void> => {
		try {
			if (this.#dbConnection) {
				const conn = await this.#mongoPool.acquire();
				await this.#mongoPool.release(conn);
				this.#dbConnection = undefined;
				console.log('Successfully released MongoDB connection to pool.');
			}

			await this.#mongoPool.drain();
			await this.#mongoPool.clear();
		} catch (err) {
			console.log('Failed to release connection to pool', err);
			throw err;
		}
	};

	closeConnection = async (): Promise<void> => {
		try {
			await this.releaseConnections();
			await this.#mongoClient.close();
			console.log('MongoDB client connection closed.');
		} catch (err) {
			console.log('Failed to release connection to pool', err);
			throw err;
		}
  	};
};