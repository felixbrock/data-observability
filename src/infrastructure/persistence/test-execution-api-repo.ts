import fetch from 'node-fetch';
import { appConfig } from '../../config';
import { ITestExecutionApiRepo } from '../../domain/test-execution-api/i-test-execution-api-repo';
import { QualTestExecutionResultDto } from '../../domain/test-execution-api/qual-test-execution-result-dto';
import { QuantTestExecutionResultDto } from '../../domain/test-execution-api/quant-test-execution-result-dto';
import { isApiErrorResponse, isRichApiErrorResponse } from '../../util/log';

export default class TestExecutionApiRepo implements ITestExecutionApiRepo {
  #baseUrl = appConfig.baseUrl.testEngine;

  executeTest = async (
    testSuiteId: string,
    testType: string,
    jwt: string,
    targetOrgId?: string
  ): Promise<QuantTestExecutionResultDto | QualTestExecutionResultDto> => {
    try {
      const payload = {
        targetOrgId,
        testType,
      };

      const timeoutDuration = 1000 * 240;

      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorisation: `Bearer ${jwt}`,
        },
        body: JSON.stringify(payload),
      };

      const controller = new AbortController();
      const { signal } = controller;

      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeoutDuration);

      const url = `${this.#baseUrl}/tests/${testSuiteId}/execute`;

      const response = await fetch(url, {
        ...requestOptions,
        signal,
      });

      clearTimeout(timeoutId);

      const jsonResponse: any = await response.json();
      if (response.status === 201) return jsonResponse;
      throw new Error(jsonResponse.message);
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('Error: Test Execution Request timed out');
        }
      }
  
      if (isApiErrorResponse(error)) {
        if (isRichApiErrorResponse(error))
          console.error(error.response.data.error.message);
        console.error(error.stack);
      } else if (error) console.trace(error);
      return Promise.reject(new Error(''));
    }
  };
}
