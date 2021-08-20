import { AppEnvName } from '../../shared-src/app-env-name';

export function getMandatoryEnv(name: AppEnvName): string {
  const val = process.env[name];

  if (!val) throw new Error(`Was expecting a mandatory environment variable named ${name} to exist, but it was missing or empty`);

  return val;
}
