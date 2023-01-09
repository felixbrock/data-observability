export default interface IUseCase<
  IRequest,
  IResponse,
  IAuth = null,
  IDb = null
> {
  execute(props: {
    req: IRequest;
    auth?: IAuth;
    db?: IDb;
  }): Promise<IResponse> | IResponse;
  // eslint-disable-next-line semi
}
