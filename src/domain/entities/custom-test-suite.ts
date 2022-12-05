import { ExecutionType } from '../value-types/execution-type';
import { BaseAnomalyTestSuite } from '../value-types/transient-types/base-test-suite';

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

export interface CustomTestSuiteProps extends BaseAnomalyTestSuite {
  id: string;
  name: string;
  description: string;
  sqlLogic: string;
  targetResourceIds: string[];
  // template?: TestTemplate
}

export type CustomTestSuiteDto = CustomTestSuiteProps;

export class CustomTestSuite implements CustomTestSuiteDto {
  #id: string;

  #activated: boolean;

  #threshold: number;

  #executionFrequency: number;

  #name: string;

  #description: string;

  #sqlLogic: string;

  #targetResourceIds: string[];

  #cron?: string;

  #executionType: ExecutionType;

  get id(): string {
    return this.#id;
  }

  get activated(): boolean {
    return this.#activated;
  }

  get threshold(): number {
    return this.#threshold;
  }

  get executionFrequency(): number {
    return this.#executionFrequency;
  }

  get name(): string {
    return this.#name;
  }

  get description(): string {
    return this.#description;
  }

  get sqlLogic(): string {
    return this.#sqlLogic;
  }

  get targetResourceIds(): string[] {
    return this.#targetResourceIds;
  }

  get cron(): string | undefined {
    return this.#cron;
  }

  get executionType(): ExecutionType {
    return this.#executionType;
  }

  private constructor(props: CustomTestSuiteProps) {
    this.#id = props.id;
    this.#activated = props.activated;
    this.#threshold = props.threshold;
    this.#executionFrequency = props.executionFrequency;
    this.#name = props.name;
    this.#description = props.description;
    this.#sqlLogic = props.sqlLogic;
    this.#targetResourceIds = props.targetResourceIds;
    this.#cron = props.cron;
    this.#executionType = props.executionType;
  }

  static create = (props: CustomTestSuiteProps): CustomTestSuite => {
    if (!props.id) throw new TypeError('CustomTestSuite must have id');
    if (!props.name) throw new TypeError('CustomTestSuite must have name');
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
    executionFrequency: this.#executionFrequency,
    id: this.#id,
    name: this.#name,
    sqlLogic: this.#sqlLogic,
    targetResourceIds: this.#targetResourceIds,
    threshold: this.#threshold,
    cron: this.#cron,
    executionType: this.#executionType,
  });
}
