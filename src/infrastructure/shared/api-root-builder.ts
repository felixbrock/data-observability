import { nodeEnv } from '../../config';

export default async (
  serviceName: string,
  port: string,
  path: string
): Promise<string> => {
  try {
    if (nodeEnv === 'development') return `http://localhost:${port}/${path}`;
    return `http://localhost:${port}/${path}`;

    console.log(serviceName);
    

    // const discoveredService: DiscoveredService = await discoverService(
    //   serviceDiscoveryNamespace,
    //   `${serviceName}-service`
    // );

    // return `http://${discoveredService.ip}:${discoveredService.port}/${path}`;
  } catch (error: unknown) {
    if (typeof error === 'string') return Promise.reject(error);
    if (error instanceof Error) return Promise.reject(error.message);
    return Promise.reject(new Error('Unknown error occured'));
  }
};
