export default interface BaseAuth {
  jwt: string;
  isSystemInternal: boolean;
  callerOrgId?: string;
  // eslint-disable-next-line semi
}
