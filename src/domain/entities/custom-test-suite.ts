import { CustomThresholdMode } from '../value-types/custom-threshold-mode';
import { ExecutionType } from '../value-types/execution-type';
import { BaseQuantTestSuite } from '../value-types/transient-types/base-test-suite';

export const customTestTypes = [
  'Custom',
  // 'TestTemplate'
] as const;
export type CustomTestType = typeof customTestTypes[number];

export const parseCustomTestType = (testType: unknown): CustomTestType => {
  const identifiedElement = customTestTypes.find(
    (element) => element === testType
  );
  if (identifiedElement) return identifiedElement;
  throw new Error('Provision of invalid type');
};

export interface CustomTestSuiteProps extends BaseQuantTestSuite {
  name: string;
  description?: string;
  sqlLogic: string;
  targetResourceIds: string[];
  // template?: TestTemplate
}

export type CustomTestSuiteDto = CustomTestSuiteProps;

export class CustomTestSuite implements CustomTestSuiteDto {
  #id: string;

  #activated: boolean;

  #customUpperThreshold?: number;

  #customLowerThreshold?: number;

  #customUpperThresholdMode: CustomThresholdMode;

  #customLowerThresholdMode: CustomThresholdMode;

  #feedbackUpperThreshold?: number;

  #feedbackLowerThreshold?: number;

  #name: string;

  #description?: string;

  #sqlLogic: string;

  #targetResourceIds: string[];

  #cron: string;

  #executionType: ExecutionType;

  #deletedAt?: string;

  #lastAlertSent?: string;

  get id(): string {
    return this.#id;
  }

  get activated(): boolean {
    return this.#activated;
  }

  get customUpperThreshold(): number | undefined {
    return this.#customUpperThreshold;
  }

  get customUpperThresholdMode(): CustomThresholdMode {
    return this.#customUpperThresholdMode;
  }

  get customLowerThreshold(): number | undefined {
    return this.#customLowerThreshold;
  }

  get customLowerThresholdMode(): CustomThresholdMode {
    return this.#customLowerThresholdMode;
  }

  get feedbackLowerThreshold(): number | undefined {
    return this.#feedbackLowerThreshold;
  }

  get feedbackUpperThreshold(): number | undefined {
    return this.#feedbackUpperThreshold;
  }

  get name(): string {
    return this.#name;
  }

  get description(): string | undefined {
    return this.#description;
  }

  get sqlLogic(): string {
    return this.#sqlLogic;
  }

  get targetResourceIds(): string[] {
    return this.#targetResourceIds;
  }

  get cron(): string {
    return this.#cron;
  }

  get executionType(): ExecutionType {
    return this.#executionType;
  }

  get deletedAt(): string | undefined {
    return this.#deletedAt;
  }

  get lastAlertSent(): string | undefined {
    return this.#lastAlertSent;
  }

  private constructor(props: CustomTestSuiteProps) {
    this.#id = props.id;
    this.#activated = props.activated;
    this.#customLowerThreshold = props.customLowerThreshold;
    this.#customUpperThreshold = props.customUpperThreshold;
    this.#customLowerThresholdMode = props.customLowerThresholdMode;
    this.#customUpperThresholdMode = props.customUpperThresholdMode;
    this.#name = props.name;
    this.#description = props.description;
    this.#sqlLogic = props.sqlLogic;
    this.#targetResourceIds = props.targetResourceIds;
    this.#cron = props.cron;
    this.#executionType = props.executionType;
    this.#feedbackLowerThreshold = props.feedbackLowerThreshold;
    this.#feedbackUpperThreshold = props.feedbackUpperThreshold;

    this.#deletedAt = props.deletedAt;
    this.#lastAlertSent = props.lastAlertSent;
  }

  static create = (props: CustomTestSuiteProps): CustomTestSuite => {
    if (!props.id) throw new TypeError('CustomTestSuite must have id');
    if (!props.name) throw new TypeError('CustomTestSuite must have name');
    if (!props.cron) throw new TypeError('CustomTestSuite must have cron job');
    if (!props.description)
      throw new TypeError('CustomTestSuite must have description');
    if (!props.sqlLogic)
      throw new TypeError('CustomTestSuite must have sqlLogic');
    if (!props.executionType)
      throw new TypeError('CustomTestSuite must have execution type');

    return new CustomTestSuite(props);
  };

  toDto = (): CustomTestSuiteDto => ({
    activated: this.#activated,
    description: this.#description,
    id: this.#id,
    name: this.#name,
    sqlLogic: this.#sqlLogic,
    targetResourceIds: this.#targetResourceIds,
    customLowerThreshold: this.#customLowerThreshold,
    customUpperThreshold: this.#customUpperThreshold,
    customLowerThresholdMode: this.#customLowerThresholdMode,
    customUpperThresholdMode: this.#customUpperThresholdMode,
    cron: this.#cron,
    executionType: this.#executionType,
    feedbackLowerThreshold: this.#feedbackLowerThreshold,
    feedbackUpperThreshold: this.#feedbackUpperThreshold,

    deletedAt: this.#deletedAt,
    lastAlertSent: this.#lastAlertSent,
  });
}
