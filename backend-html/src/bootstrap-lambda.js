const lambdaRequestHandler = require('lambda-request-handler');

// note: the use of .default here is due to some things with ES6/CommonJS
// that I have no idea how it might change in the future as typescript evolves etc
// https://stackoverflow.com/questions/40294870/module-exports-vs-export-default-in-node-js-and-es6
// but anyhow, this bootstrapper is the only pure JS piece of code that has to deal with this
const app = require('./app-concrete').default;

import { setupTestData } from './testing/setup-test-data';

/**
 * A one off initialisation async that can be used to set up the environment with
 * data that might be slow to get or should be cached. This will only be called on 'cold start'
 * of the lambda.
 *
 * @returns {Promise<e.Application>}
 */
const lambdaOnceOnlyInitialisation = async () => {
  console.log('Doing lambda cold start initialisation');

  // possibly a race condition here.. will remove this as soon as the web deployed version
  // doesn't need test data
  setupTestData(false);

  console.log('Done lambda cold start initialisation');

  return app.getServer();
};

const h = lambdaRequestHandler.deferred(lambdaOnceOnlyInitialisation);

const handler = async ev => {
  console.log('REQ', JSON.stringify(ev));
  const res = await h(ev);
  console.log('RES', JSON.stringify(res));
  return res;
};

module.exports = { handler };
