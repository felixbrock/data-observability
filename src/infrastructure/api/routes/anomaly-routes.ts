import { Router } from 'express';
import app from '../../ioc-register';
import PostAnomalyFeedback from '../controllers/post-anomaly-feedback-controller';

const testDataRoutes = Router();

const getAccounts = app.resolve('getAccounts');

const dbo = app.resolve('dbo');

const postAnomalyFeedbackController = new PostAnomalyFeedback(
  app.resolve('postAnomalyFeedback'),
  getAccounts,
  app.resolve('getSnowflakeProfile'),
  dbo

);

testDataRoutes.post('/feedback', (req, res) => {
  postAnomalyFeedbackController.execute(req, res);
});

export default testDataRoutes;
