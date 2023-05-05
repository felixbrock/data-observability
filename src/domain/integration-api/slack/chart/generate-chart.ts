// todo - violation of clean code dependency flow
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Canvas, createCanvas } from 'canvas';
import { EChartsOption, init, YAXisComponentOption } from 'echarts';
import { appConfig } from '../../../../config';
import IUseCase from '../../../services/use-case';
import GenerateChartRepo from '../../../../infrastructure/persistence/generate-chart-repo';
import Result from '../../../value-types/transient-types/result';
import { IDbConnection } from '../../../services/i-db';

export interface ChartRepresentation {
  url: string;
}

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

export type GenerateChartAuthDto = null;

export type GenerateChartResponseDto = Result<ChartRepresentation>;

export class GenerateChart
  implements
    IUseCase<
      GenerateChartRequestDto,
      GenerateChartResponseDto,
      null,
      IDbConnection
    >
{
  #getDefaultYAxis = (
    minBase: number,
    maxBase: number
  ): YAXisComponentOption => ({
    type: 'value',
    boundaryGap: [0, '30%'],
    min: `${minBase - (maxBase - minBase) * 0.5}`,
    max: `${maxBase + (maxBase - minBase) * 0.5}`,
  });

  readonly #repo: GenerateChartRepo;

  constructor(generateChartRepo: GenerateChartRepo) {
    this.#repo = generateChartRepo;
  }

  #getHistoryMinMax = (
    historyDataSet: TestHistoryDataPoint[]
  ): [number, number] =>
    historyDataSet.reduce<[number, number]>(
      (acc, curr) => {
        const localAcc = acc;

        if (curr.value < localAcc[0]) localAcc[0] = curr.value;
        if (curr.value > localAcc[1]) localAcc[1] = curr.value;

        return localAcc;
      },
      [historyDataSet[0].value, historyDataSet[0].value]
    );

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

        localAcc.xAxis.push(el.timestamp.slice(0, 10));
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
        min: 'dataMin',
        max: 'dataMax',
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
      value,
      test_suite_id: testSuiteId,
      executed_on: executedOn,
      value_upper_bound: valueUpperBound,
      value_lower_bound: valueLowerBound,
      is_anomaly: isAnomaly,
      user_feedback_is_anomaly: userFeedbackIsAnomaly,
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

    const isTimestamp = (obj: unknown): obj is Date =>
      !!obj && typeof obj === 'object' && obj.constructor.name === 'Date';
    if (
      typeof value !== 'number' ||
      typeof testSuiteId !== 'string' ||
      !(typeof executedOn === 'string' || isTimestamp(executedOn)) ||
      typeof isAnomaly !== 'boolean' ||
      typeof userFeedbackIsAnomaly !== 'number' ||
      !isOptionalOfType<number>(valueLowerBound, 'number') ||
      !isOptionalOfType<number>(valueUpperBound, 'number')
    )
      throw new Error('Received unexpected type');

    const datapoint = {
      isAnomaly,
      userFeedbackIsAnomaly,
      timestamp:
        typeof executedOn === 'string' ? executedOn : executedOn.toISOString(),
      valueLowerBound,
      valueUpperBound,
      value,
    };

    return datapoint;
  };

  #queryTestHistory = async (
    testSuiteId: string,
    dbConnection: IDbConnection,
    callerOrgId: string
  ): Promise<TestHistoryDataPoint[]> => {

    const queryResult = await this.#repo.readTestHistory(testSuiteId, dbConnection, callerOrgId);

    if (!queryResult)
      throw new Error('Missing history data point query value');

    const historyDataPoints = queryResult
      .reverse()
      .map(
        (el: { [key: string]: unknown }): TestHistoryDataPoint =>
          this.#toTestHistoryDataPoint(el)
      );

    return historyDataPoints;
  };

  #buildChart = (datapoints: TestHistoryDataPoint[]): Canvas => {
    const canvas = createCanvas(800, 600);

    const chart = init(canvas);

    chart.setOption(
      this.#buildDefaultOption(
        this.#getDefaultYAxis(...this.#getHistoryMinMax(datapoints)),
        datapoints
      )
    );

    return canvas;
  };

  #storeChart = async (
    chart: Canvas,
    testSuiteId: string
  ): Promise<ChartRepresentation> => {
    const client = new S3Client({
      region: appConfig.cloud.region,
    });
    const command = new PutObjectCommand({
      ACL: 'public-read',
      Key: `${testSuiteId}.jpeg`,
      Bucket: 'slack-charts',
      Body: chart.toBuffer('image/jpeg'),
      ContentType: 'image/jpeg',
    });
    const response = await client.send(command);

    if (response.$metadata.httpStatusCode !== 200)
      throw new Error('Problem ocurred while uploading chart');

    const url = `https://slack-charts.s3.eu-central-1.amazonaws.com/${testSuiteId}.jpeg`;

    return { url };
  };

  async execute(props: {
    req: GenerateChartRequestDto;
    dbConnection: IDbConnection,
    callerOrgId: string
  }): Promise<GenerateChartResponseDto> {
    const { req, dbConnection, callerOrgId } = props;

    try {
      const historyDataPoints = await this.#queryTestHistory(
        req.testSuiteId,
        dbConnection,
        callerOrgId
      );

      const chart = this.#buildChart(historyDataPoints);

      const representation = await this.#storeChart(chart, req.testSuiteId);

      return Result.ok(representation);
    } catch (error: unknown) {
      if (error instanceof Error) console.error(error.stack);
      else if (error) console.trace(error);
      return Result.fail('');
    }
  }
}
