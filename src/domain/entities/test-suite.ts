import { Expectation } from "../value-types/expectation";
import { Job } from "../value-types/job";

export interface TestSuiteProperties {
  id: string;
  activated: boolean;
  expectation: Expectation
  job: Job
  targetId: string;
}

export class TestSuite {
  #id: string;

  #activated: boolean;

  #expectation: Expectation;

  #job: Job;

  #targetId: string;

  get id(): string {
    return this.#id;
  }

  get activated(): boolean {
    return this.#activated;
  }

  get expectation(): Expectation {
    return this.#expectation;
  }

  get job(): Job{
    return this.#job;
  }

  get targetId(): string {
    return this.#targetId;
  }

  private constructor(props: TestSuiteProperties) {
    this.#id = props.id;
    this.#activated = props.activated;
    this.#expectation = props.expectation;
    this.#job = props.job;
    this.#targetId = props.targetId;
  }

  static create = (props: TestSuiteProperties): TestSuite => {
    if (!props.id) throw new TypeError('TestSuite must have id');
    if (!props.expectation) throw new TypeError('TestSuite must have expectation');
    if (!props.job) throw new TypeError('TestSuite must have job');
    if (!props.targetId) throw new TypeError('TestSuite must have target id');

    const testSuite = new TestSuite(props);

    return testSuite;
  };
}
