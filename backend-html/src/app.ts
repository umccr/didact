import cookieParser from 'cookie-parser';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import favicon from 'serve-favicon';
import { IRoute } from './api/routes/_routes.interface';
import { errorMiddleware } from './middlewares/error.middleware';
import path from 'path';
import * as fs from 'fs';
import parseUrl from 'parseurl';
import { URLSearchParams } from 'url';
import * as _ from 'lodash';
import cryptoRandomString from 'crypto-random-string';
import { AppEnvName } from '../../shared-src/app-env-name';
import { getMandatoryEnv } from './app-env';
import { resetRouter } from './api/routes/reset-router';
import { OpenIdRoute } from './api/routes/public/openid-router';
import { WellKnownRoute } from './api/routes/public/well-known-router';
import { VisaTestRoute } from './api/routes/visatest.route';
import { DatasetRoute } from './api/routes/protected/dataset.route';
import { ApplicationRoute } from './api/routes/protected/application.route';
import { VisaRoute } from './api/routes/service-service/visa.route';
import { ManifestRoute } from './api/routes/service-service/manifest.route';
import { BrokerRoute } from './api/routes/broker-temp/broker-router';
import { UserRoute } from './api/routes/protected/user.route';
import { ReferenceDataRoute } from './api/routes/protected/reference-data.route';
import { createJwksCallback } from './api/routes/_routes.utils';

export class App {
  public app: express.Application;
  public env: string;

  private readonly required_runtime_environment: AppEnvName[] = ['LOGIN_HOST', 'LOGIN_CLIENT_ID'];
  private readonly optional_runtime_environment: AppEnvName[] = ['LOGIN_CLIENT_SECRET', 'SEMANTIC_VERSION', 'BUILD_VERSION'];

  // a absolute path to where static files are to be served from
  public staticFilesPath: string;

  // the absolute path for where the index.html template is
  public indexHtmlPath: string;

  // a nonce we create as a one-off and pass into index pages we serve (given the nature of lambdas
  // this makes it effectively a short lived nonce)
  private readonly nonce: string;

  constructor() {
    this.app = express();
    this.env = process.env.NODE_ENV || 'development';

    this.nonce = cryptoRandomString({ length: 16 });

    // first look for the existence of a production distribution right in our own folder
    // this should only happen in Docker builds - but we will preference this location
    // irrespective of whether we are in development or production
    this.staticFilesPath = path.resolve('client', 'dist');

    if (!fs.existsSync(this.staticFilesPath)) {
      if (this.env === 'development') {
        // ONLY IN DEVELOPMENT try looking for the build folder directly in our working dev area
        this.staticFilesPath = path.resolve('..', 'frontend', 'build');
      }
    }

    // we immediately discover (and abort) if our file structures are not set up
    // the way we expect with the matching frontend/ files
    this.indexHtmlPath = path.resolve(this.staticFilesPath, 'index.html');

    if (!fs.existsSync(this.indexHtmlPath)) {
      throw Error(`No index.html file found where expected at ${this.indexHtmlPath}`);
    }

    this.app.set('query parser', queryString => {
      return new URLSearchParams(queryString);
    });

    const secretCallback = createJwksCallback();

    this.initializeMiddlewares();

    this.initializeUnsecuredRoutes([new WellKnownRoute(), new VisaTestRoute()]);
    this.initializeServiceServiceRoutes([new VisaRoute(), new ManifestRoute()]);
    // this has to be last because it seems to alter all the api registrations
    // (TBD work out why.. probably should read the app.use() docs)
    this.initializeSecuredRoutes([
      new DatasetRoute(secretCallback),
      new ApplicationRoute(secretCallback),
      new UserRoute(null),
      new ReferenceDataRoute(null),
    ]);

    // we cannot directly use the standard static file middleware for express
    // because we have a behaviour for index.html that is heavily customised
    // (and express.static will *always* actually serve up the plain index.html
    // if asked explicitly whereas we *always* want to do some string replace in index.html)

    // luckily it is pretty straightforward to copy the 10 or so lines of code
    // and customise
    // from https://github.com/expressjs/serve-static
    this.app.get('*', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const requestPath = parseUrl(req).pathname;

        // we can short circuit out of any fancy handling if it is very explicit what they want
        if (requestPath === '/' || requestPath.endsWith('/index.html')) {
          return await this.serveCustomIndexHtml(req, res);
        }

        // chrome in dev mode tries to establish this path so we should return not found to let it do its thing
        if (requestPath === '/sockjs-node') {
          return next();
        }

        if (this.env === 'production') {
          return await this.strictServeRealFileOrIndex(requestPath, req, res, next);
        } else {
          return await this.looseServeRealFileOrIndex(requestPath, req, res, next);
        }
      } catch (e) {
        next(e);
      }
    });

    this.initializeErrorHandling();
  }

  public listen(port: number, callback?: () => void) {
    this.app.listen(port, () => {
      console.log(`🚀 App listening on the port ${port}`);
      if (callback)
        callback();
    });
  }

  public getServer() {
    return this.app;
  }

  /**
   * Builds an environment dictionary that is whitelisted to known safe values using
   * whatever logic we want. This can fetch values from any source we want
   * - environment variables passed in via CloudFormation
   * - secrets?
   * - parameter store
   * - request variables
   * @param req
   * @private
   */
  private buildSafeEnvironment(req: Request): { [id: string]: string } {
    const result = {
      // we make a nonce for insertion into inline scripts and automatically allow the nonce in our CSP
      nonce: this.nonce,
      // we make the definition of the backend environment available to the front end too
      env: this.env,
    };

    const addEnv = (key: AppEnvName, required: boolean) => {
      const val = process.env[key];

      if (required && !val) throw new Error(`Our environment for index.html templating requires a variable named ${key}`);

      if (val) result[key.toLowerCase()] = val;
    };

    for (const k of this.required_runtime_environment) addEnv(k, true);
    for (const k of this.optional_runtime_environment) addEnv(k, false);

    return result;
  }

  /**
   * Maps all the *deploy* time (stack) and *view* time (from browser fetching index.html)
   * environment data into data-attributes that will be
   * passed into the React app.
   *
   * @param req
   * @param safe_environment
   * @private
   */
  private buildDataAttributesForReact(req: Request, safe_environment: { [id: string]: string }): string {
    let dataAttributes = '';

    const addAttribute = (k: string, v: string) => {
      if (!v) throw new Error(`The index.html generator must have access to a valid value to set for ${k}`);

      dataAttributes = dataAttributes + `\t\t${k}="${v}"\n`;
    };

    // these are env variables set in the solution deployment stack - probably via Cloud Formation parameters but also
    // locally they can be set just by shell env variables
    addAttribute('data-semantic-version', safe_environment.semantic_version || 'undefined');
    addAttribute('data-build-version', safe_environment.build_version || 'unknown');
    addAttribute('data-deployed-environment', safe_environment.env);
    addAttribute('data-login-host', safe_environment.login_host);
    addAttribute('data-login-client-id', safe_environment.login_client_id);

    return dataAttributes;
  }

  /**
   * Serves up the frontends index.html but does so with insertion of values known to the
   * server - that can then relay through to the React frontend. This is an exceedingly useful
   * pattern that helps us control the configuration of React - but from the backend deployment.
   *
   * @param req
   * @param res
   * @private
   */
  private async serveCustomIndexHtml(req: Request, res: Response) {
    // the base index.html template (note: this index.html will *already* have been through a level of
    // templating during the create-react-app build phase - any further templating we are about to do
    // is to insert values that are from the *deployment* or *browser* context)
    let indexText = await fs.promises.readFile(path.resolve(this.staticFilesPath, 'index.html'), 'utf8');

    // env data we want to use for index.html substitutions
    const env = this.buildSafeEnvironment(req);

    // we also want to build some other attributes that will be passed all the way into React
    env['data_attributes'] = this.buildDataAttributesForReact(req, env);

    // because it is very simple we are choosing to use the lodash template engine
    const compiled = _.template(indexText);

    indexText = compiled(env);

    // because our index.html is dynamically constructed (we use underlying env values + request header + geo locate etc)
    // we ensure that it is never cached (there is a distinction between no-cache and no-store - and apparently
    // no-cache is friendlier to browsers in general - and in our case will still force dynamic fetching - so that
    // is what we are going with)
    res.set('Cache-Control', 'no-cache');

    res.send(indexText);
  }

  private async strictServeRealFileOrIndex(requestPath: string, req: Request, res: Response, next: NextFunction) {
    // we *attempt to send a file* but not being able to do it just means we need to serve up the
    // index.html
    // (this is needed to support React routing - where the React URL in a client browser can end up as
    //  "https://site.com/home/nested/blah"
    //  but if the user hits 'refresh' at that point - we still want to serve up the underlying index.html
    //  and then allow React routing to find the correct react page)
    res.sendFile(
      requestPath,
      {
        root: this.staticFilesPath,
        cacheControl: true,
        immutable: true,
        maxAge: '1d',
        lastModified: false,
        index: false,
        etag: false,
      },
      err => {
        if (err) {
          if (err['code'] === 'ENOENT') {
            return this.serveCustomIndexHtml(req, res);
          } else next(err);
        }
      },
    );
  }

  private async looseServeRealFileOrIndex(requestPath: string, req: Request, res: Response, next: NextFunction) {
    const requestBase = path.posix.basename(requestPath);

    async function* walk(dir: string, matchBase: string) {
      for await (const d of await fs.promises.opendir(dir)) {
        const entry = path.join(dir, d.name);
        if (d.isDirectory()) yield* walk(entry, matchBase);
        else if (d.isFile()) {
          if (d.name.localeCompare(matchBase, undefined, { sensitivity: 'base' }) === 0) yield entry;
        }
      }
    }

    let hasSent = false;

    for await (const p of walk(this.staticFilesPath, requestBase)) {
      res.sendFile(p, { etag: false, cacheControl: false });
      hasSent = true;
      break;
    }

    if (!hasSent) await this.serveCustomIndexHtml(req, res);
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
    // we have a temporary hacky workaround whilst waiting for PKCE support from cilogon
    const loginHost = getMandatoryEnv('LOGIN_HOST');
    if (loginHost.includes('cilogon')) {
      routes.push(new OpenIdRoute());
    }
    // we have the ability to reset all the data - which is definitely something to remove!
    this.app.use('/remove-me', resetRouter);

    routes.forEach(route => {
      this.app.use(route.path, route.router);
    });
  }

  private initializeSecuredRoutes(routes: IRoute[]) {
    routes.forEach(route => {
      this.app.use('/api', route.router);
    });
  }

  private initializeServiceServiceRoutes(routes: IRoute[]) {
    // so this is where we would institute even *more* security as these
    // are routes we are expecting calls from other trusted services
    // (ala registered htsget endpoints etc)
    // AT THE MOMENT IS PUBLIC
    routes.forEach(route => {
      this.app.use('/api', route.router);
    });
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }
}
