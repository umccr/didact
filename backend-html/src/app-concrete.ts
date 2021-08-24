import { App } from './app';
import { DatasetRoute } from './api/routes/dataset.route';
import { ApplicationRoute } from './api/routes/application.route';
import { VisaRoute } from './api/routes/visa.route';

// construct a concrete instance of the app - including all the routes used for the real site
// (we have dynamic routes here in the constructor as opposed to just listing them *inside* App -
// to allow very selective route construction in individual unit testing)
const app = new App([new DatasetRoute(), new ApplicationRoute(), new VisaRoute()]);

export default app;
