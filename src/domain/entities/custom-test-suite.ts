import { BaseTestSuite } from "../value-types/transient-types/base-test-suite";

export interface CustomTestSuite extends BaseTestSuite {
  name: string;
  description: string;
  sqlLogic: string;
  targetResourceIds: string[];
}


