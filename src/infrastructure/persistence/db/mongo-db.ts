import { NextFunction, Request, Response } from 'express';
import { Db, MongoClient, ServerApiVersion } from 'mongodb';
import { appConfig } from '../../../config';

const getClient = (): MongoClient =>
  new MongoClient(appConfig.mongodb.url, {
    serverApi: ServerApiVersion.v1,
  });

export const routerDbConnection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  getClient()
    .connect()
    .then((connectedClient) => {
      // req.db = connectedClient.db(appConfig.mongodb.dbName);
      req.db = connectedClient;
      next();
    })
    .catch((err) => next(err));
};

export const cronJobDbConnection = async (): Promise<Db> => {
  const connectedClient = await getClient().connect();
  return connectedClient.db(appConfig.mongodb.dbName);
};
