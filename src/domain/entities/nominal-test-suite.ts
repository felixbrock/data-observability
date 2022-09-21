import { BaseTestSuite } from '../value-types/transient-types/base-test-suite';

export const materializationTypes = ['Table', 'View'] as const;
export type MaterializationType = typeof materializationTypes[number];

export const parseMaterializationType = (
  materializationType: unknown
): MaterializationType => {
  const identifiedElement = materializationTypes.find(
    (element) => element === materializationType
  );
  if (identifiedElement) return identifiedElement;
  throw new Error('Provision of invalid type');
};

export interface TestTarget {
  targetResourceId: string;
  databaseName: string;
  schemaName: string;
  materializationName: string;
  materializationType: MaterializationType;
  columnName?: string;
}

export const nominalTestTypes = [
  'MaterializationSchemaChange',
] as const;
export type NominalTestType = typeof nominalTestTypes[number];

export const parseNominalTestType = (testType: unknown): NominalTestType => {
  const identifiedElement = nominalTestTypes.find((element) => element === testType);
  if (identifiedElement) return identifiedElement;
  throw new Error('Provision of invalid type');
};

export interface NominalTestSuiteProperties extends BaseTestSuite {
  type: NominalTestType;
  target: TestTarget;
}

export class NominalTestSuite implements BaseTestSuite {
  #id: string;

  #organizationId: string;

  #activated: boolean;

  #type: NominalTestType;

  #target: TestTarget;

  #executionFrequency: number;

  get id(): string {
    return this.#id;
  }

  get organizationId(): string {
    return this.#organizationId;
  }

  get activated(): boolean {
    return this.#activated;
  }

  get type(): NominalTestType {
    return this.#type;
  }

  get target(): TestTarget {
    return this.#target;
  }

  get executionFrequency(): number {
    return this.#executionFrequency;
  }

  private constructor(props: NominalTestSuiteProperties) {
    this.#id = props.id;
    this.#organizationId = props.organizationId;
    this.#activated = props.activated;
    this.#type = props.type;
    this.#executionFrequency = props.executionFrequency;
    this.#target = props.target;
  }

  static create = (props: NominalTestSuiteProperties): NominalTestSuite => {
    if (!props.id) throw new TypeError('TestSuite must have id');
    if (!props.organizationId)
      throw new TypeError('TestSuite must have organization id');

    return new NominalTestSuite(props);
  };
}
