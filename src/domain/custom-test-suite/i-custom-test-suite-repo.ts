import { CustomTestSuite} from "../entities/custom-test-suite";
import { IServiceRepo } from "../services/i-service-repo";
import { ExecutionType } from "../value-types/execution-type";

export interface CustomTestSuiteUpdateDto {
    activated?: boolean;
    threshold?: number;
    targetResourceIds?: string[];
    name?: string;
    description?: string;
    sqlLogic?: string;
    cron?: string;
    executionType?: ExecutionType;
  }
  
  export interface CustomTestSuiteQueryDto {
    activated?: boolean;
  }

export type ICustomTestSuiteRepo =  IServiceRepo<CustomTestSuite, CustomTestSuiteQueryDto, CustomTestSuiteUpdateDto>; 