/**
 * The dataset service provides business layer functionality around
 * datasets.
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import Dynamo from 'dynamodb-onetable/Dynamo';
import { Paged, Table } from 'dynamodb-onetable';
import { getTable } from '../db/didact-table-utils';
import { DatasetDbType, DatasetSubjectDbType, getTypes } from '../db/didact-table-types';
import { DatasetApiModel } from '../../../../shared-src/api-models/dataset';

function log(target, key, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const functionName = key;
    console.log(functionName + '(' + args.join(', ') + ')');
    const result = originalMethod.apply(this, args);
    return result;
  };

  return descriptor;
}

class DatasetService {
  private readonly table: Table;

  constructor() {
    const client = new Dynamo({
      client: new DynamoDBClient({}),
    });

    this.table = getTable(client);
  }

  @log
  public async asDataset(dsId: string): Promise<DatasetApiModel> {
    const { DatasetDbModel, DatasetSubjectDbModel } = getTypes(this.table);

    const ds = await DatasetDbModel.get({ id: dsId });

    const subjects = [];

    {
      let aeNext: any = null;
      let aeItemPage: Paged<DatasetSubjectDbType>;
      do {
        aeItemPage = await DatasetSubjectDbModel.find({ datasetId: dsId });

        for (const item of aeItemPage) {
          subjects.push(item);
        }

        aeNext = aeItemPage.next;
      } while (aeNext);
    }

    return DatasetService.itemToDataset(ds, subjects);
  }

  @log
  public async list(): Promise<DatasetApiModel[]> {
    const { DatasetDbModel } = getTypes(this.table);

    const results: DatasetApiModel[] = [];

    // as this is the 'top' level operation for datasets it does involve a scan.. the number
    // of datasets is rather self limiting so it should be ok

    // we explicitly *do not* get the dataset artifacts in this scan otherwise that
    // could actually be a lot of data

    let next: any = null;
    let itemPage: Paged<DatasetDbType>;
    do {
      itemPage = await DatasetDbModel.scan({}, { next, limit: 25 });

      for (const item of itemPage) {
        results.push(DatasetService.itemToDataset(item, null));
      }

      next = itemPage.next;
    } while (itemPage.next);

    return results;
  }

  /**
   * Takes the raw db records and creates a suitable JSON API model
   * for a dataset.
   *
   * @param item
   * @param subjects
   * @private
   */
  private static itemToDataset(item: any, subjects: any[] | null): DatasetApiModel {
    const result: DatasetApiModel = {
      id: item.id,
      name: item.name,
      description: item.description,
      committeeId: item.committeeId,
      committeeDisplayName: item.committeeId,
      dataUses: item.dataUses,
    };
    if (subjects != null) {
      result.subjects = {};
      for (const s of subjects) {
        result.subjects[s.subjectId] = {
          sampleIds: Array.from(s.sampleIds),
        };
        if (s.familyId) {
          result.subjects[s.subjectId].familyId = s.familyId;
        }
      }
    }
    return result;
  }
}

export const datasetServiceInstance = new DatasetService();
