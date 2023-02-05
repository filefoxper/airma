import { appRouter } from '../works/express';
import { generateRoutes } from '../works/route';
import UserRoute from './user';

export default appRouter(generateRoutes([UserRoute]));
