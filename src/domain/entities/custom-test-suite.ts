import { BaseTestSuite } from '../value-types/transient-types/base-test-suite';

export interface CustomTestSuiteProperties extends BaseTestSuite {
  name: string;
  description: string;
  sqlLogic: string;
  targetResourceIds: string[];
}

export interface CustomTestSuiteDto extends CustomTestSuiteProperties {
  id: string;
}

export class CustomTestSuite implements CustomTestSuiteDto {
  #id: string;

  #organizationId: string;

  #activated: boolean;

  #threshold: number;

  #executionFrequency: number;

  #name: string;

  #description: string;

  #sqlLogic: string;

  #targetResourceIds: string[];

  get id(): string {
    return this.#id;
  }

  get organizationId(): string {
    return this.#organizationId;
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

  private constructor(props: CustomTestSuiteProperties) {
    this.#id = props.id;
    this.#organizationId = props.organizationId;
    this.#activated = props.activated;
    this.#threshold = props.threshold;
    this.#executionFrequency = props.executionFrequency;
    this.#name = props.name;
    this.#description = props.description;
    this.#sqlLogic = props.sqlLogic;
    this.#targetResourceIds = props.targetResourceIds;
  }

  static create = (props: CustomTestSuiteProperties): CustomTestSuite => {
    if (!props.id) throw new TypeError('CustomTestSuite must have id');
    if (!props.organizationId)
      throw new TypeError('CustomTestSuite must have organization id');
    if (!props.name) throw new TypeError('CustomTestSuite must have name');
    if (!props.description)
      throw new TypeError('CustomTestSuite must have description');
    if (!props.sqlLogic)
      throw new TypeError('CustomTestSuite must have sqlLogic');
    if (!props.targetResourceIds)
      throw new TypeError('CustomTestSuite must have targetResourceIds');

    return new CustomTestSuite(props);
  };

  toDto = (): CustomTestSuiteDto => ({
    activated: this.#activated,
    description: this.#description,
    executionFrequency: this.#executionFrequency,
    id: this.#id,
    name: this.#name,
    organizationId: this.#organizationId,
    sqlLogic: this.#sqlLogic,
    targetResourceIds: this.#targetResourceIds,
    threshold: this.#threshold,
  });
}
