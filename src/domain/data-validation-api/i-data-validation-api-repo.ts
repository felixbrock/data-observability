import { DataValidationDto } from './data-validation-dto';

export interface DataValidationResultDto {
  meta: {
    great_expectations_version: string | null;
    expectation_suite_name: string | null;
    run_id: {
      run_time: string | null;
      run_name: string | null;
    };
    batch_spec: unknown;
    batch_markers: unknown;
    active_batch_definition: unknown;
    validation_time: string | null;
  };
  results: [
    {
      meta: { [key: string]: unknown };
      success: boolean;
      exception_info: {
        raised_exception: boolean;
        exception_traceback: unknown;
        exception_message: unknown;
      };
      expectation_config: {
        kwargs: {
          column: string;
          mostly: number;
          threshold: number;
          double_sided: boolean;
          batch_id: unknown[];
        };
        expectation_type: string;
        meta: { [key: string]: unknown };
      };
      result: {
        element_count: number;
        unexpected_count: number;
        unexpected_percent: number;
        partial_unexpected_list: number[];
        missing_count: number;
        missing_percent: number;
        unexpected_percent_total: number;
        unexpected_percent_nonmissing: number;
      };
    }
  ];
  evaluation_parameters: { [key: string]: unknown };
  success: boolean;
  statistics: {
    evaluated_expectations: number;
    successful_expectations: number;
    unsuccessful_expectations: number;
    success_percent: number;
  };
}

export interface IDataValidationApiRepo {
  validate(validationDto: DataValidationDto): Promise<DataValidationResultDto>;
}
