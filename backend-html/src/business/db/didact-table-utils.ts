import { Table } from 'dynamodb-onetable';
import { getMandatoryEnv } from '../../app-env';
import { DidactTableSchema } from './didact-table-schema';

/**
 * The table type must be associated with a client, so we need
 * to make it dynamically on each request. Unify the logic to
 * one spot here.
 *
 * @param client a Dynamodb client
 */
export function getTable(client): Table {
  const tableName = getMandatoryEnv('TABLE_NAME');

  return new Table({
    name: tableName,
    client: client,
    uuid: 'ulid',
    logger: true,
    timestamps: true,
    isoDates: true,
    schema: DidactTableSchema,
  });
}
