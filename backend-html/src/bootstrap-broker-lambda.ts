import lambdaRequestHandler from 'lambda-request-handler';
import { BrokerApp } from './broker-app';

/**
 *  NOTE: this is a temporary broker service - re-using code from Didact -
 * just in an interim whilst we work with CILogon to perform the same
 * functions.
 */

/**
 * A one off initialisation async that can be used to set up the environment with
 * data that might be slow to get, or should be cached. This will only be called on 'cold start'
 * of the lambda.
 *
 * @returns {Promise<e.Application>}
 */
const lambdaOnceOnlyInitialisation = async () => {
  console.log('Lambda Cold Start');

  const brokerApp = new BrokerApp();

  console.log('Lambda Cold Start End');

  return brokerApp.getServer();
};

const h = lambdaRequestHandler.deferred(lambdaOnceOnlyInitialisation);

const shorterStringReplacer = (key, value) => {
  if (typeof value === 'string') {
    if (value.length > 256) return value.substr(0, 256) + '... truncated ...';
  }
  return value;
};

export const handler = async ev => {
  console.log('Lambda Request - ', JSON.stringify(ev, shorterStringReplacer));
  const res = await h(ev);
  console.log('Lambda Response - ', JSON.stringify(res, shorterStringReplacer));
  return res;
};
