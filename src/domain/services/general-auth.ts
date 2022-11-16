export default interface GeneralAuth {
    jwt: string;
    isSystemInternal: boolean;
    callerOrgId: string;
};