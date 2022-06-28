import { Expectation } from "./expectation";
import { Job } from "./job";

export interface TestSuiteProperties {
  id: string;
  expectation: Expectation;
  job: Job
}

export class TestSuite {
  #id: string;

  #expectation: Expectation;

  #job: Job;

  get id(): string {
    return this.#id;
  }

  get expectation(): Expectation {
    return this.#expectation;
  }

  get job(): Job {
    return this.#job;
  }

  private constructor(properties: TestSuiteProperties) {
    this.#id = properties.id;
    this.#expectation = properties.expectation;
    this.#job = properties.job;
  }

  static create = (properties: TestSuiteProperties): TestSuite => {
    if (!properties.id) throw new TypeError('TestSuite must have id');
    if (!properties.expectation) throw new TypeError('TestSuite must have expectation');
    if (!properties.job) throw new TypeError('TestSuite must have job');

    const testSuite = new TestSuite(properties);

    return testSuite;
  };
}
