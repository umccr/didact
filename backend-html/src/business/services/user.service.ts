/**
 * The user service provides a layer between the canonical list of
 * users of the system as held in CILogon.
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import Dynamo from 'dynamodb-onetable/Dynamo';
import { Paged, Table } from 'dynamodb-onetable';
import { getTable } from '../db/didact-table-utils';
import { DatasetDbType, getTypes } from '../db/didact-table-types';
import { DatasetApiModel } from '../../../../shared-src/api-models/dataset';
import { UserResearcherApiModel } from '../../../../shared-src/api-models/user-researcher';

import { getMandatoryEnv } from '../../app-env';
import { ldapClientPromise, ldapSearchPromise } from './_ldap.utils';

class UserService {
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

  public async listResearchers(): Promise<UserResearcherApiModel[]> {
    const client = await ldapClientPromise();
    const x = await ldapSearchPromise(client, 'o=NAGIMdev,o=CO,dc=biocommons,dc=org,dc=au', {
      filter: '&(objectClass=voPerson)(isMemberOf=didact:dac)',
      scope: 'sub',
      attributes: ['voPersonID', 'cn', 'isMemberOf'],
    });

    /*const { DatasetDbModel } = getTypes(this.table);

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

    return results; */
    return x;
  }
}

export const userServiceInstance = new UserService();
