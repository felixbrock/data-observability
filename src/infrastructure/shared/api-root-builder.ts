import { appConfig } from '../../config';

export default async (
  // serviceName: string,
  gateway: string,
  path: string,
  isContainerizedTarget: boolean
): Promise<string> => {
  try {
    if (appConfig.express.mode === 'development')
      return `http://${
        isContainerizedTarget ? 'host.docker.internal' : 'localhost'
      }:${gateway}/${path}`;
    if (appConfig.express.mode === 'production')
      return `https://${gateway}/${path}`;

    throw new Error('Node env misalignment');

    // const discoveredService: DiscoveredService = await discoverService(
    //   serviceDiscoveryNamespace,
    //   `${serviceName}-service`
    // );

    // return `http://${discoveredService.ip}:${discoveredService.port}/${path}`;
  } catch (error: unknown) {
    if(error instanceof Error && error.message) console.trace(error.message); 
    else if (!(error instanceof Error) && error) console.trace(error);
    return Promise.reject(new Error(''));
  }
};
