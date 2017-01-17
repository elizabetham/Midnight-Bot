// @flow

//Dependencies
import express from 'express';

//Types
import type {$Request, $Response}
from 'express';

//routers
import userRouter from './UserRouter';
import statsRouter from './StatsRouter';

//Create api router
const apiRouter = express.Router();

apiRouter.use('/user', userRouter);
apiRouter.use('/stats', statsRouter)

export default apiRouter;
