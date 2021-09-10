import { setupTestData } from './testing/setup-test-data';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { BrokerRoute } from "./api/routes/public/broker-router";
import { App } from "./app";

// the development node bootstrap entrypoint
// this entrypoint is used for running the backend locally on a dev machine - but must
// still be done with AWS env variables set for permissions into the dev AWS
const SECRET_NAME = 'local/didact/registry-test.biocommons.org.au';

console.log('Bootstrapping local server');
console.log('Creating fresh test data');

setupTestData(true).then(async () => {
  console.log('Establishing OIDC/LDAP secrets');

  // even for local dev we'd prefer not to store the client id/secrets
  // in github so we fetch from AWS on each startup
  const client = new SecretsManagerClient({});

  const secrets = await client.send(
    new GetSecretValueCommand({
      SecretId: SECRET_NAME,
    }),
  );

  const secretJson = JSON.parse(secrets.SecretString);

  if (!secretJson.client_id || !secretJson.client_secret) {
    throw Error('Was expecting a secret in AWS dev with OIDC client ids and secrets');
  }

  // note that these env variables need to match up with those set in the real IaC stack
  process.env['LOGIN_HOST'] = 'https://cilogon.org';
  process.env['LOGIN_CLIENT_ID'] = secretJson.client_id;
  process.env['LOGIN_CLIENT_SECRET'] = secretJson.client_secret;
  process.env['LDAP_HOST'] = 'ldaps://ldap-test.cilogon.org';
  process.env['LDAP_SECRET'] = secretJson.ldap_password;

  console.log('Creating Express app');

  const app = new App();

  // IT IS NOT THE ENTRYPOINT FOR USE IN PRODUCTION WITHIN THE AWS LAMBDA ENVIRONMENT
  app.listen(3000);
});
