/**
 * The dataset service provides business layer functionality around
 * datasets.
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import Dynamo from 'dynamodb-onetable/Dynamo';
import { Paged, Table } from 'dynamodb-onetable';
import { getTable } from '../db/didact-table-utils';
import { DatasetDbType, getTypes } from '../db/didact-table-types';
import { DatasetApiModel } from '../../../../shared-src/api-models/dataset';

class DatasetService {
  private readonly table: Table;

  constructor() {
    const client = new Dynamo({
      client: new DynamoDBClient({}),
    });

    this.table = getTable(client);
  }

  public itemToDataset(item: any): DatasetApiModel {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      committeeId: item.committeeId,
      committeeDisplayName: item.committeeId,
      dataUses: item.dataUses,
    };
  }

  public async asDataset(dsId: string): Promise<DatasetApiModel> {
    const { DatasetDbModel } = getTypes(this.table);

    console.log(`Get of '${dsId}' `);

    const ds = await DatasetDbModel.get({ id: dsId });

    return this.itemToDataset(ds);
  }

  public async list(): Promise<DatasetApiModel[]> {
    const { DatasetDbModel } = getTypes(this.table);

    const results: DatasetApiModel[] = [];

    // as this is the 'top' level operation for datasets it does involve a scan.. the number
    // of datasets is rather self limiting so it should be ok

    let next: any = null;
    let itemPage: Paged<DatasetDbType[]>;
    do {
      itemPage = await DatasetDbModel.scan({}, { next, limit: 25 });

      for (const item of itemPage) {
        results.push(this.itemToDataset(item));
      }

      next = itemPage.next;
    } while (itemPage.next);

    return results;
  }
}

export const datasetServiceInstance = new DatasetService();
