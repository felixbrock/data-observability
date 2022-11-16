import snowflake from 'snowflake-sdk';

export const connect = (options: snowflake.ConnectionOptions): snowflake.Connection => snowflake.createConnection(options);

export const handleStreamEnd = ():void => console.log('All rows consumed');

export const handleStreamError = (err: Error): void => {console.log(`Snowflake query failed. Error: ${err}`);};