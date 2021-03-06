import { Entity, Table } from 'dynamodb-onetable';
import { DidactTableSchema } from './didact-table-schema';

export type DatasetDbType = Entity<typeof DidactTableSchema.models.Dataset>;
export type DatasetSubjectDbType = Entity<typeof DidactTableSchema.models.DatasetSubject>;
export type CommitteeDbType = Entity<typeof DidactTableSchema.models.Committee>;
export type CommitteeMemberDbType = Entity<typeof DidactTableSchema.models.CommitteeMember>;
export type ApplicationDbType = Entity<typeof DidactTableSchema.models.Application>;
export type ApplicationEventDbType = Entity<typeof DidactTableSchema.models.ApplicationEvent>;
export type ApplicationReleaseSubjectDbType = Entity<typeof DidactTableSchema.models.ApplicationReleaseSubject>;

/**
 * Return a model type object that represents a Typescript friendly version
 * of our underlying table data structures.
 *
 * @param table
 */
export function getTypes(table: Table) {
  const DatasetDbModel = table.getModel<DatasetDbType>('Dataset');
  const DatasetSubjectDbModel = table.getModel<DatasetSubjectDbType>('DatasetSubject');
  const CommitteeDbModel = table.getModel<CommitteeDbType>('Committee');
  const CommitteeMemberDbModel = table.getModel<CommitteeMemberDbType>('CommitteeMember');
  const ApplicationDbModel = table.getModel<ApplicationDbType>('Application');
  const ApplicationEventDbModel = table.getModel<ApplicationEventDbType>('ApplicationEvent');
  const ApplicationReleaseSubjectDbModel = table.getModel<ApplicationReleaseSubjectDbType>('ApplicationReleaseSubject');

  return {
    DatasetDbModel,
    DatasetSubjectDbModel,
    CommitteeDbModel,
    CommitteeMemberDbModel,
    ApplicationDbModel,
    ApplicationEventDbModel,
    ApplicationReleaseSubjectDbModel,
  };
}
