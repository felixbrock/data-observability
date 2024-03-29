import { CustomThresholdMode } from '../custom-threshold-mode';
import { ExecutionType } from '../execution-type';

export interface BaseTestSuite {
  id: string;
  activated: boolean;
  cron: string;
  executionType: ExecutionType;
  deletedAt?: string;
  lastAlertSent?: string;
}

export interface BaseQuantTestSuite extends BaseTestSuite {
  customLowerThreshold?: number;
  customUpperThreshold?: number;
  customLowerThresholdMode: CustomThresholdMode;
  customUpperThresholdMode: CustomThresholdMode;
  feedbackLowerThreshold?: number;
  feedbackUpperThreshold?: number;
}
