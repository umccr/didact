import { getMandatoryEnv } from '../../app-env';
import ldapjs from 'ldapjs';

// our LDAP client library uses old style callbacks so this is a set
// of utils functions to turn them into promises.

/**
 * Returns a promise to resolve an authenticated ldap client
 * configured as per our environment settings.
 */
export function ldapClientPromise(): Promise<any> {
  const ldapHost = getMandatoryEnv('LDAP_HOST');

  const client = ldapjs.createClient({
    url: [ldapHost],
  });

  return new Promise<any>((resolve, reject) => {
    const ldapUser = getMandatoryEnv('LDAP_USER');
    const ldapSecret = getMandatoryEnv('LDAP_SECRET');
    client.bind(ldapUser, ldapSecret, err => {
      if (err) return reject(err);
      resolve(client);
    });
  });
}

/**
 * Returns a promise to resolve an ldap search.
 *
 * @param client
 * @param base
 * @param options
 */
export function ldapSearchPromise(client: any, base: string, options: any): Promise<any[]> {
  return new Promise<any[]>((resolve, reject) => {
    const results = [];
    client.search(base, options, (err: any, res: any) => {
      if (err) return reject(err);
      // res.on('searchRequest', searchRequest => {});
      //res.on('searchReference', referral => {
      //  console.log('referral: ' + referral.uris.join());
      //});
      res.on('searchEntry', entry => {
        results.push(entry.object);
      });
      res.on('error', err => {
        return reject(err.message);
      });
      res.on('end', () => {
        resolve(results);
      });
    });
  });
}
