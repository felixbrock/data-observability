import { Binds, IConnectionPool } from "../snowflake-api/i-snowflake-api-repo";
import { QuerySnowflake } from "../snowflake-api/query-snowflake";
import BaseAuth from "./base-auth";

export default abstract class BaseTriggerTestSuiteExecution {
    #querySnowflake: QuerySnowflake;

    constructor (querySnowflake: QuerySnowflake) {
        this.#querySnowflake = querySnowflake;
    }


    wasAltered = async (
        props: {
          databaseName: string;
          schemaName: string;
          matName: string;
        },
        auth: BaseAuth,
        connPool: IConnectionPool
      ): Promise<boolean> => {
        const { databaseName, schemaName, matName } = props;
    
        const automaticExecutionFrequency = 5;
    
        // todo - get last test execution time
        const wasAlteredClause = `timediff(minute, convert_timezone('UTC', last_altered)::timestamp_ntz, sysdate()) < ${automaticExecutionFrequency}`;
    
        const binds: Binds = [databaseName, schemaName, matName];
    
        const queryText = `select ${wasAlteredClause} as was_altered from ${databaseName}.information_schema.tables
            where table_catalog = upper(?) and table_schema = upper(?) and table_name = upper(?);`;
    
        const querySnowflakeResult = await this.#querySnowflake.execute(
          { queryText, binds },
          auth,
          connPool
        );
    
        if (!querySnowflakeResult.success)
          throw new Error(querySnowflakeResult.error);
    
        const result = querySnowflakeResult.value;
        if (!result) throw new Error(`"Was altered" query failed`);
    
        if (result.length !== 1)
          throw new Error('No or multiple was altered results received found');
    
        const wasAltered = result[0].WAS_ALTERED;
        if (typeof wasAltered !== 'boolean')
          throw new Error('Received non-bool was altered val');
    
        return wasAltered;
      };

}