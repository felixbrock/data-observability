import { CustomTestSuite} from "../entities/custom-test-suite";
import { IBaseServiceRepo } from "../services/i-base-service-repo";
import { ExecutionType } from "../value-types/execution-type";

export interface CustomTestSuiteUpdateDto {
    activated?: boolean;
    threshold?: number;
    frequency?: number;
    targetResourceIds?: string[];
    name?: string;
    description?: string;
    sqlLogic?: string;
    cron?: string;
    executionType?: ExecutionType;
  }
  
  export interface CustomTestSuiteQueryDto {
    activated?: boolean;
    executionFrequency?: number;
  }

export type ICustomTestSuiteRepo =  IBaseServiceRepo<CustomTestSuite, CustomTestSuiteQueryDto, CustomTestSuiteUpdateDto>; 