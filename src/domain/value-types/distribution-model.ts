import {
  Expectation,
  ExpectationConfiguration,
} from './expectation';
import { IStatisticalModel} from '../statistical-model/i-statistical-model';

export interface DistributionModelPrototype {
  expectationConfiguration: ExpectationConfiguration;
  expectationType: string;
}; 

export interface DistributionModelProperties {
  expectation: Expectation;
}

export class DistributionModel implements IStatisticalModel<number> {
  #expectation: Expectation;

  get expectation(): Expectation {
    return this.#expectation;
  }

  private constructor(props: DistributionModelProperties) {
    this.#expectation = props.expectation;}

  run = (data: number[]): void =>{
    // run own logic
    console.log(data);
    

  }; 

  static create = (prototype: DistributionModelPrototype): DistributionModel => {
    if (!prototype.expectationConfiguration) throw new TypeError('DistributionModel must have expectation configuration');
    if (!prototype.expectationConfiguration) throw new TypeError('DistributionModel must have expectation type');

    const distributionModel = this.#build(prototype);
    return distributionModel;
  };

  static #build = (prototype: DistributionModelPrototype): DistributionModel => {
    const expectation = Expectation.create({
      configuration: prototype.expectationConfiguration,
      type: prototype.expectationType,
    });

      const props: DistributionModelProperties = {
        expectation
      };

    return new DistributionModel(props);
  };
}
