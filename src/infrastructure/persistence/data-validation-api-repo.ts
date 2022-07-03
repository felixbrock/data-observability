import axios from 'axios';
import { IDataValidationApiRepo, DataValidationResultDto } from '../../domain/data-validation-api/i-data-validation-api-repo';
import { DataValidationDto } from '../../domain/data-validation-api/data-validation-dto';

export default class DataValidationApiRepo implements IDataValidationApiRepo {
  // #path = 'api/v1';

  // #serviceName = 'account';

  // #port = '8081';



  validate = async (
    validationDto: DataValidationDto
  ): Promise<DataValidationResultDto> => {
    try {
      const apiRoot = 'http://127.0.0.1:5000';

      const response = await axios.post(
        `${apiRoot}/validate`,
        validationDto
      );
      const jsonResponse = response.data;
      if (response.status === 201) return jsonResponse;
      throw new Error(jsonResponse.message);
    } catch (error: unknown) {
      if(typeof error === 'string') return Promise.reject(error);
      if(error instanceof Error) return Promise.reject(error.message);
      return Promise.reject(new Error('Unknown error occured'));
    }
  };
}
