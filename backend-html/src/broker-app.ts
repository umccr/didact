import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import favicon from 'serve-favicon';
import { IRoute } from './api/routes/_routes.interface';
import { errorMiddleware } from './middlewares/error.middleware';
import path from 'path';
import { URLSearchParams } from 'url';
import { WellKnownRoute } from './api/routes/public/well-known-router';
import { BrokerRoute } from './api/routes/broker-temp/broker-router';

/**
 * This app is a temporary endpoint that we can deploy to
 * broker.nagim.dev
 * and it will act as a token exchange endpoint for access tokens -> passports
 * This is only necessary until CILogon can produce passports - at which
 * point the exchange operation will happen with them.
 */
export class BrokerApp {
  public app: express.Application;
  public env: string;

  constructor() {
    this.app = express();
    this.env = process.env.NODE_ENV || 'development';

    this.app.set('query parser', queryString => {
      return new URLSearchParams(queryString);
    });

    this.initializeMiddlewares();

    this.initializeUnsecuredRoutes([new WellKnownRoute(), new BrokerRoute()]);

    this.initializeErrorHandling();
  }

  public listen(port: number) {
    this.app.listen(port, () => {
      console.log(`🚀 Broker App listening on the port ${port}`);
    });
  }

  public getServer() {
    return this.app;
  }

  private initializeMiddlewares() {
    // we want to serve this first so it avoids any logging - as it is irrelevant to us
    this.app.use(favicon(path.join(__dirname, 'favicon.ico')));

    // setup logging levels based on environment
    if (this.env === 'production') {
      this.app.use(morgan('combined'));
    } else if (this.env === 'development') {
      this.app.use(morgan('short'));
    }

    this.app.use(helmet.hidePoweredBy());
    this.app.use(hpp());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
  }

  private initializeUnsecuredRoutes(routes: IRoute[]) {
    routes.forEach(route => {
      this.app.use(route.path, route.router);
    });
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }
}
