export interface JobProperties {
  localId: string;
  frequency: number;
}

export class Job {
  #localId: string;

  #frequency: number;

  get localId(): string {
    return this.#localId;
  }

  get frequency(): number {
    return this.#frequency;
  }

  private constructor(properties: JobProperties) {
    this.#localId = properties.localId;
    this.#frequency = properties.frequency;
  }

  static create = (properties: JobProperties): Job => {
    if (!properties.localId) throw new TypeError('Job must have id');
    if (!properties.frequency) throw new TypeError('Job must have frequency');

    const job = new Job(properties);

    return job;
  };
}
