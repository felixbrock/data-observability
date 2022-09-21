import {
  NominalTestSuite,
  TestTarget,
  NominalTestType,
} from '../entities/nominal-test-suite';

export interface NominalTestSuiteDto {
  id: string;
  activated: boolean;
  type: NominalTestType;
  executionFrequency: number;
  target: TestTarget;
  organizationId: string;
}

export const buildNominalTestSuiteDto = (nominalTestSuite: NominalTestSuite): NominalTestSuiteDto => ({
  id: nominalTestSuite.id,
  activated: nominalTestSuite.activated,
  type: nominalTestSuite.type,
  executionFrequency: nominalTestSuite.executionFrequency,
  target: nominalTestSuite.target,
  organizationId: nominalTestSuite.organizationId,
});
