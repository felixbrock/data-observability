export default interface IUseCase<IRequest, IResponse, IAuth, IDb = undefined> {
  execute(request: IRequest, auth: IAuth, db: IDb ): Promise<IResponse> | IResponse;
  // eslint-disable-next-line semi
}
