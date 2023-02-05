import { Express, Router } from 'express';

export const appRouter = (array: Array<[string, Router]>) => {
  return (app: Express) => {
    array.forEach(([url, router]: [string, Router]) => {
      app.use(url, router);
    });
    return app;
  };
};
