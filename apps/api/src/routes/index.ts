import { Router } from 'express';
import { agentsRouter } from './agents';
import { trustRouter } from './trust';
import { actionsRouter } from './actions';
import { docketRouter } from './docket';

export const apiRouter = Router();

apiRouter.use('/agents', agentsRouter);
apiRouter.use('/trust', trustRouter);
apiRouter.use('/actions', actionsRouter);
apiRouter.use('/docket', docketRouter);
