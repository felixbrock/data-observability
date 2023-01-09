// todo - violation of clean code dependency flow
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Canvas, createCanvas } from 'canvas';
import { EChartsOption, init, YAXisComponentOption } from 'echarts';
import { appConfig } from '../../../../config';
import BaseAuth from '../services/base-auth';
import IUseCase from '../services/use-case';
import { Binds, IConnectionPool } from '../snowflake-api/i-snowflake-api-repo';
import { QuerySnowflake } from '../snowflake-api/query-snowflake';
import Result from '../value-types/transient-types/result';

interface VisualPiece {
  gte: number;
  lte: number;
  color: string;
  colorAlpha: number;
}

const isVisualPiece = (obj: unknown): obj is VisualPiece =>
  !!obj && typeof obj === 'object' && 'color' in obj;

export interface TestHistoryDataPoint {
  isAnomaly: boolean;
  userFeedbackIsAnomaly: number;
  timestamp: string;
  valueLowerBound: number;
  valueUpperBound: number;
  value: number;
}

export interface GenerateChartRequestDto {
  testSuiteId: string;
}

export type GenerateChartAuthDto = BaseAuth;

export type GenerateChartResponseDto = Result<{ url: string }>;

export class GenerateChart
  implements
    IUseCase<
      GenerateChartRequestDto,
      GenerateChartResponseDto,
      GenerateChartAuthDto,
      IConnectionPool
    >
{
  readonly #defaultYAxis: YAXisComponentOption = {
    type: 'value',
    boundaryGap: [0, '30%'],
  };

  readonly #querySnowflake: QuerySnowflake;

  constructor(querySnowflake: QuerySnowflake) {
    this.#querySnowflake = querySnowflake;
  }

  #buildDefaultOption = (
    yAxis: YAXisComponentOption,
    data: TestHistoryDataPoint[]
  ): EChartsOption => {
    const hasAnomolies = data.some(
      (el) =>
        el.isAnomaly &&
        (el.userFeedbackIsAnomaly === -1 || el.userFeedbackIsAnomaly === 1)
    );

    const { xAxis, values, upperBounds, lowerBounds } = data.reduce(
      (
        accumulation: {
          xAxis: string[];
          values: number[];
          upperBounds: number[];
          lowerBounds: number[];
        },
        el: TestHistoryDataPoint
      ) => {
        const localAcc = accumulation;

        localAcc.xAxis.push(el.timestamp);
        localAcc.values.push(el.value);
        localAcc.upperBounds.push(el.valueUpperBound);
        localAcc.lowerBounds.push(el.valueLowerBound);

        return localAcc;
      },
      { xAxis: [], values: [], upperBounds: [], lowerBounds: [] }
    );

    return {
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: xAxis,
      },
      yAxis,
      toolbox: {
        feature: {
          saveAsImage: {},
        },
      },
      visualMap: hasAnomolies
        ? {
            show: false,
            dimension: 0,
            pieces: data
              .map((el, index) =>
                el.isAnomaly &&
                (el.userFeedbackIsAnomaly === 1 ||
                  el.userFeedbackIsAnomaly === -1)
                  ? {
                      gte: index === 0 ? index : index - 1,
                      lte: index + 1,
                      color: 'red',
                      colorAlpha: 0.2,
                    }
                  : undefined
              )
              .filter(isVisualPiece),
          }
        : undefined,
      series: [
        {
          name: 'Lower Threshold',
          type: 'line',
          smooth: true,
          showSymbol: false,
          lineStyle: {
            type: 'dotted',
            color: 'grey',
            // width: 2
          },
          itemStyle: {
            color: 'grey',
          },
          data: lowerBounds,
        },
        {
          name: 'Upper Threshold',
          type: 'line',
          smooth: true,
          showSymbol: false,
          lineStyle: {
            type: 'dashed',
            color: 'grey',
            // width: 2
          },
          itemStyle: {
            color: 'grey',
          },
          data: upperBounds,
        },
        {
          name: 'Measurements',
          type: 'line',
          smooth: true,
          lineStyle: {
            color: '#6f47ef',
            // width: 2
          },
          itemStyle: {
            color: '#6f47ef',
          },
          areaStyle: hasAnomolies ? {} : undefined,
          data: values,
        },
      ],
      tooltip: {
        trigger: 'axis',
      },
    };
  };

  #toTestHistoryDataPoint = (queryResultEntry: {
    [key: string]: unknown;
  }): TestHistoryDataPoint => {
    const {
      VALUE: value,
      TEST_SUITE_ID: testSuiteId,
      EXECUTED_ON: executedOn,
      VALUE_UPPER_BOUND: valueUpperBound,
      VALUE_LOWER_BOUND: valueLowerBound,
      IS_ANOMALY: isAnomaly,
      USER_FEEDBACK_IS_ANOMALY: userFeedbackIsAnomaly,
    } = queryResultEntry;

    const isOptionalOfType = <T>(
      val: unknown,
      targetType:
        | 'string'
        | 'number'
        | 'bigint'
        | 'boolean'
        | 'symbol'
        | 'undefined'
        | 'object'
        | 'function'
    ): val is T => val === null || typeof val === targetType;

    if (
      typeof value !== 'number' ||
      typeof testSuiteId !== 'string' ||
      typeof executedOn !== 'string' ||
      typeof isAnomaly !== 'boolean' ||
      typeof userFeedbackIsAnomaly !== 'number' ||
      !isOptionalOfType<number>(valueLowerBound, 'number') ||
      !isOptionalOfType<number>(valueUpperBound, 'number')
    )
      throw new Error('Received unexpected type');

    const datapoint = {
      isAnomaly,
      userFeedbackIsAnomaly,
      timestamp: executedOn,
      valueLowerBound,
      valueUpperBound,
      value,
    };

    return datapoint;
  };

  #queryTestHistory = async (
    testSuiteId: string,
    auth: BaseAuth,
    sfConnPool: IConnectionPool
  ): Promise<TestHistoryDataPoint[]> => {
    const binds: Binds = [testSuiteId];

    const whereCondition = `test_history.test_suite_id = ?`;

    const queryText = `select 
        test_history.test_suite_id as test_suite_id,
        test_history.value as value,
        test_executions.executed_on as executed_on,
        test_results.expected_value_upper_bound as value_upper_bound,
        test_results.expected_value_lower_bound as value_lower_bound,
        test_history.is_anomaly as is_anomaly,
        test_history.user_feedback_is_anomaly as user_feedback_is_anomaly 
      from cito.observability.test_history as test_history
      inner join cito.observability.test_executions as test_executions
        on test_history.execution_id = test_executions.id
      left join cito.observability.test_results as test_results
        on test_history.execution_id = test_results.execution_id
      where ${whereCondition}
      order by test_executions.executed_on desc limit 200;`;

    const queryResult = await this.#querySnowflake.execute(
      { queryText, binds },
      auth,
      sfConnPool
    );

    if (!queryResult.success) throw new Error(queryResult.error);
    if (!queryResult.value)
      throw new Error('Missing history data point query value');

    const historyDataPoints = queryResult.value
      .reverse()
      .map((el): TestHistoryDataPoint => this.#toTestHistoryDataPoint(el));

    return historyDataPoints;
  };

  #buildChart = (datapoints: TestHistoryDataPoint[]): Canvas => {
    const canvas = createCanvas(800, 600);

    const chart = init(canvas);

    chart.setOption(this.#buildDefaultOption(this.#defaultYAxis, datapoints));

    return canvas;
  };

  #storeChart = async (chart: Canvas): Promise<{url: string}> => {
    const client = new S3Client({
      region: appConfig.cloud.region,
    });
    const command = new PutObjectCommand({
      ACL: 'public-read',
      Key: 'test-xxx.jpeg',
      Bucket: 'slack-charts',
      Body: chart.toBuffer('image/jpeg'),
      ContentType: 'image/jpeg',
    });
    const response = await client.send(command);

    if(response.$metadata.httpStatusCode !== 200)
    throw new Error('Problem ocurred while uploading chart')

    const url = ``

    return {}

  };

  async execute(
    req: GenerateChartRequestDto,
    auth: GenerateChartAuthDto,
    connPool: IConnectionPool
  ): Promise<GenerateChartResponseDto> {
    try {
      const historyDataPoints = await this.#queryTestHistory(
        req.testSuiteId,
        auth,
        connPool
      );

      const chart = this.#buildChart(historyDataPoints);

      await this.#storeChart(chart);

      const buffer = ;

      

      return Result.ok();
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
