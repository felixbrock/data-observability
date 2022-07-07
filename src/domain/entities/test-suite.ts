import { ExpectationConfiguration } from '../value-types/expectation';
import {
  DataType,
  IStatisticalModel,
} from '../statistical-model/i-statistical-model';
import { Frequency, Job } from '../value-types/job';
import { DistributionModel } from '../value-types/distribution-model';

const expecationType: { [key: string]: string } = {
  Freshness: 'expect_column_max_to_be_between',
  Cardinality: 'expect_column_unique_value_count_to_be_between',
  Uniqueness: 'expect_column_proportion_of_unique_values_to_be_between',
  Nullness: 'expect_column_values_to_not_be_null',
  SortednessIncreasing: 'expect_column_values_to_be_increasing',
  SortednessDecreasing: 'expect_column_values_to_be_decreasing',
  Distribution: 'expect_column_value_z_scores_to_be_less_than',
};

const testTypes = [
  'Freshness',
  'Cardinality',
  'Uniqueness',
  'Nullness',
  'SortednessIncreasing',
  'SortednessDecreasing',
  'Distribution',
] as const;
export type TestType = typeof testTypes[number];

export const parseTestType = (testType: unknown): TestType => {
  const identifiedFrequency = testTypes.find((element) => element === testType);
  if (identifiedFrequency) return identifiedFrequency;
  throw new Error('Provision of invalid test type');
};

export interface TestSuitePrototype {
  id: string;
  activated: boolean;
  type: TestType;
  expectationConfiguration: ExpectationConfiguration;
  jobFrequency: Frequency;
  targetId: string;
}

export interface TestSuiteProperties {
  id: string;
  activated: boolean;
  type: TestType;
  job: Job;
  statisticalModel: IStatisticalModel<DataType>;
  targetId: string;
}

export const createStatisticalModel = (
  testType: TestType,
  expectationConfiguration: ExpectationConfiguration,
  expectationType: string
): IStatisticalModel<DataType> => {
  switch (testType) {
    case parseTestType(testTypes[0]):
      return DistributionModel.create({
        expectationConfiguration,
        expectationType,
      });
      console.log('hello');

      break;

    case parseTestType(testTypes[1]):
      return DistributionModel.create({
        expectationConfiguration,
        expectationType,
      });
      console.log('hello');

      break;
    case parseTestType(testTypes[2]):
      return DistributionModel.create({
        expectationConfiguration,
        expectationType,
      });
      console.log('hello');
      break;

    case parseTestType(testTypes[3]):
      return DistributionModel.create({
        expectationConfiguration,
        expectationType,
      });
      console.log('hello');
      break;

    case parseTestType(testTypes[4]):
      return DistributionModel.create({
        expectationConfiguration,
        expectationType,
      });
      console.log('hello');
      break;

    case parseTestType(testTypes[5]):
      return DistributionModel.create({
        expectationConfiguration,
        expectationType,
      });
      console.log('hello');
      break;

    case parseTestType(testTypes[6]):
      return DistributionModel.create({
        expectationConfiguration,
        expectationType,
      });
    default:
      throw new TypeError('Provision of invalid test type');
  }
};

export class TestSuite {
  #id: string;

  #activated: boolean;

  #type: TestType;

  #job: Job;

  #statisticalModel: IStatisticalModel<DataType>;

  #targetId: string;

  get id(): string {
    return this.#id;
  }

  get activated(): boolean {
    return this.#activated;
  }

  get type(): TestType {
    return this.#type;
  }

  get statisticalModel(): IStatisticalModel<DataType> {
    return this.#statisticalModel;
  }

  get job(): Job {
    return this.#job;
  }

  get targetId(): string {
    return this.#targetId;
  }

  private constructor(props: TestSuiteProperties) {
    this.#id = props.id;
    this.#activated = props.activated;
    this.#type = props.type;
    this.#job = props.job;
    this.#statisticalModel = props.statisticalModel;
    this.#targetId = props.targetId;
  }

  test = (data: number[]): void => {
    this.#statisticalModel.run(data);
    // read data from SF
  };

  static create = (prototype: TestSuitePrototype): TestSuite => {
    if (!prototype.id) throw new TypeError('TestSuite must have id');
    if (!prototype.type) throw new TypeError('Expectation must have type');
    if (!prototype.targetId)
      throw new TypeError('TestSuite must have target id');

    const job = Job.create({ frequency: prototype.jobFrequency });
    const statisticalModel = createStatisticalModel(
      prototype.type,
      prototype.expectationConfiguration,
      expecationType[prototype.type]
    );

    const testSuite = this.build({
      id: prototype.id,
      activated: prototype.activated,
      job,
      statisticalModel,
      targetId: prototype.targetId,
      type: prototype.type,
    });
    return testSuite;
  };

  static build = (props: TestSuiteProperties): TestSuite => {
    if (!props.id) throw new TypeError('TestSuite must have id');
    if (!props.type) throw new TypeError('Expectation must have type');
    if (!props.targetId) throw new TypeError('TestSuite must have target id');

    return new TestSuite(props);
  };
}
