/**
 * We have a set of named environment variables that we use to bridge from
 * outer installation level settings (CloudFormation parameters) -> settings in the backend.
 * We use this as a central point for the definition of these names and attempt to add a
 * bit of "safety" to their use.
 */
export type AppEnvName = 'TABLE_ARN' | 'TABLE_NAME' | 'SEMANTIC_VERSION' | 'BUILD_VERSION' | 'NODE_ENV';

