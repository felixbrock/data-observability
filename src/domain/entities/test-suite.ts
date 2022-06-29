import { Expectation } from "./expectation";

export interface TestSuiteProperties {
  id: string;
  expectation: Expectation
  targetId: string;
}

export class TestSuite {
  #id: string;

  #expectation: Expectation;

  #targetId: string;

  get id(): string {
    return this.#id;
  }

  get expectation(): Expectation {
    return this.#expectation;
  }

  get targetId(): string {
    return this.#targetId;
  }

  private constructor(properties: TestSuiteProperties) {
    this.#id = properties.id;
    this.#expectation = properties.expectation;
    this.#targetId = properties.targetId;
  }

  static create = (properties: TestSuiteProperties): TestSuite => {
    if (!properties.id) throw new TypeError('TestSuite must have id');
    if (!properties.expectation) throw new TypeError('TestSuite must have expectation');
    if (!properties.targetId) throw new TypeError('TestSuite must have target id');

    const testSuite = new TestSuite(properties);

    return testSuite;
  };
}
