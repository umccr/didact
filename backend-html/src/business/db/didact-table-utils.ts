import { Table } from 'dynamodb-onetable';
import { getMandatoryEnv } from '../../app-env';
import { DidactTableSchema } from './didact-table-schema';

export function getTable(client) {
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
