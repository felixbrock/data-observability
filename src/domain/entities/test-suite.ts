import { Frequency, Job } from '../value-types/job';

export const testTypes = [
  'Freshness',
  'Cardinality',
  'Uniqueness',
  'Nullness',
  'SortednessIncreasing',
  'SortednessDecreasing',
  'Distribution',
  'RowCount'
] as const;
export type TestType = typeof testTypes[number];

export const parseTestType = (testType: unknown): TestType => {
  const identifiedFrequency = testTypes.find((element) => element === testType);
  if (identifiedFrequency) return identifiedFrequency;
  throw new Error('Provision of invalid test type');
};

export interface Target {
  databaseName: string;
  tableSchema: string;
  tableName: string;
  columnName?: string;
}

export interface TestSuitePrototype {
  id: string;
  activated: boolean;
  type: TestType;
  jobFrequency: Frequency;
  target: Target;
}

export interface TestSuiteProperties {
  id: string;
  activated: boolean;
  type: TestType;
  job: Job;
  target: Target;
}

export class TestSuite {
  #id: string;

  #activated: boolean;

  #type: TestType;

  #job: Job;

  #target: Target;

  get id(): string {
    return this.#id;
  }

  get activated(): boolean {
    return this.#activated;
  }

  get type(): TestType {
    return this.#type;
  }


  get job(): Job {
    return this.#job;
  }

  get target(): Target {
    return this.#target;
  }

  private constructor(props: TestSuiteProperties) {
    this.#id = props.id;
    this.#activated = props.activated;
    this.#type = props.type;
    this.#job = props.job;
    this.#target = props.target;
  }

  static create = (prototype: TestSuitePrototype): TestSuite => {
    if (!prototype.id) throw new TypeError('TestSuite must have id');
    if (!prototype.type) throw new TypeError('Expectation must have type');

    const job = Job.create({ frequency: prototype.jobFrequency });

    const testSuite = this.build({
      id: prototype.id,
      activated: prototype.activated,
      job,
      target: prototype.target,
      type: prototype.type,
    });
    return testSuite;
  };

  static build = (props: TestSuiteProperties): TestSuite => {
    if (!props.id) throw new TypeError('TestSuite must have id');
    if (!props.type) throw new TypeError('Expectation must have type');

    return new TestSuite(props);
  };
}
