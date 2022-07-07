import { Expectation } from "../value-types/expectation";

export type DataType = number;

export interface IStatisticalModel<T> {
  expectation: Expectation;
  run: (data: T[])=>void;
};