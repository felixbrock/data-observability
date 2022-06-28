export default interface IUseCase<IRequest, IResponse, IAuth, IDbConnection = undefined> {
  execute(request: IRequest, auth: IAuth, dbConnection: IDbConnection): Promise<IResponse> | IResponse;
  // eslint-disable-next-line semi
}