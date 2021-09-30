import { DynamoDBClient, QueryCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { PanelAppDynamoBuilder } from './panel-app-dynamo-builder';
import * as fuzzysort from 'fuzzysort';
import { PanelAppPanelGene } from './panel-app-types';

export class PanelAppDynamoClient {
  readonly _client: DynamoDBClient;

  constructor() {
    // NOTE: if you get 'needs region' errors using this client - the correct thing (I think) to do is to
    // get AWS_REGION into your environment - not hard code the value here.
    // All _real_ AWS environments that we would run this code in _will_ have an AWS_REGION set
    this._client = new DynamoDBClient({});
  }

  public async panelGet(panelId: number): Promise<any> {
    const pk = PanelAppDynamoBuilder.getPanelContentPrimaryKey(panelId);
    throw new Error('Not implmented - still need to add gsk1 entries');
    const panelResult = await this._client.send(
      new GetItemCommand({
        TableName: PanelAppDynamoBuilder.TABLE_NAME,
        Key: {
          pk: {
            S: pk,
          },
        },
      }),
    );

    return {
      id: panelId,
      name: 'TBD', // panelResult[PanelAppDynamoBuilder.ATTRIBUTE_NAME_SORT_KEY]['S'],
      version: 'TBD', // panelResult[PanelAppDynamoBuilder.ATTRIBUTE_NAME_PANEL_APP_VERSION]['S'],
    };
  }

  public async panelList(): Promise<any[]> {
    const pk = PanelAppDynamoBuilder.getRandomPartitionKey(PanelAppDynamoBuilder.PK_PREFIX_PANELNAME);

    const panelNamesResult = await this._client.send(
      new QueryCommand({
        TableName: PanelAppDynamoBuilder.TABLE_NAME,
        KeyConditionExpression: `${PanelAppDynamoBuilder.ATTRIBUTE_NAME_PRIMARY_KEY} = :pk`,
        ExpressionAttributeValues: {
          ':pk': { S: pk },
        },
      }),
    );

    // any individual query can return a maximum of 1MB before needing paging - we actively want to
    // fail if paging is required - because as above - it then seems like too many items are in the dynamodb
    // and we should reconsider how we do stuff
    if (panelNamesResult.LastEvaluatedKey || panelNamesResult.Count > 500) {
      throw Error(
        'Panel name search discovered a base data set with more than 500 panels or 1MB of data - this needs to be looked at as it is an architectural weak point if the list of panels grows too large',
      );
    }

    return panelNamesResult.Items.map(item => {
      return {
        id: parseInt(item[PanelAppDynamoBuilder.ATTRIBUTE_NAME_PANEL_APP_ID]['N']),
        name: item[PanelAppDynamoBuilder.ATTRIBUTE_NAME_SORT_KEY]['S'],
        version: item[PanelAppDynamoBuilder.ATTRIBUTE_NAME_PANEL_APP_VERSION]['S'],
      };
    });
  }

  /**
   * Search the panels for panel(s) with name matching the given searchText.
   *
   * @param searchText
   */
  public async panelSearch(searchText: string): Promise<any[]> {
    const pk = PanelAppDynamoBuilder.getRandomPartitionKey(PanelAppDynamoBuilder.PK_PREFIX_PANELNAME);

    // unfortunately we can't use dynamo sort key with any clever text based filtering (other than the kind of useless
    // begins_with) - so we are going to fetch all of them each time - and then filter ourselves
    // luckily the number of panels expected is bounded by reality of clinical practice
    // (I can't imagine more than 1000).
    // But if that assumption changes then so might this dynamo structure
    const panelNamesResult = await this._client.send(
      new QueryCommand({
        TableName: PanelAppDynamoBuilder.TABLE_NAME,
        KeyConditionExpression: `${PanelAppDynamoBuilder.ATTRIBUTE_NAME_PRIMARY_KEY} = :pk`,
        ExpressionAttributeValues: {
          ':pk': { S: pk },
        },
      }),
    );

    // any individual query can return a maximum of 1MB before needing paging - we actively want to
    // fail if paging is required - because as above - it then seems like too many items are in the dynamodb
    // and we should reconsider how we do stuff
    if (panelNamesResult.LastEvaluatedKey || panelNamesResult.Count > 500) {
      throw Error(
        'Panel name search discovered a base data set with more than 500 panels or 1MB of data - this needs to be looked at as it is an architectural weak point if the list of panels grows too large',
      );
    }

    // fuzzy search with the passed in terms
    const searchResultsRaw = await fuzzysort.goAsync(
      searchText,
      panelNamesResult.Items.map(item => {
        return {
          id: parseInt(item[PanelAppDynamoBuilder.ATTRIBUTE_NAME_PANEL_APP_ID]['N']),
          name: item[PanelAppDynamoBuilder.ATTRIBUTE_NAME_SORT_KEY]['S'],
          version: item[PanelAppDynamoBuilder.ATTRIBUTE_NAME_PANEL_APP_VERSION]['S'],
        };
      }),
      {
        key: 'name',
        threshold: -1000,
        limit: 20,
      },
    );

    const searchResults = [];

    // augment the returned fuzzy sort data with some search helpers
    for (const sr of searchResultsRaw) {
      const val: any = sr.obj;
      val.hilighted = fuzzysort.highlight(sr);
      val.score = sr.score;
      searchResults.push(val);
    }

    return searchResults;
  }

  /**
   * Return the set of genes for the given panel.
   *
   * @param panelId
   */
  public async panelGenes(panelId: number): Promise<PanelAppPanelGene[]> {
    const genes: PanelAppPanelGene[] = [];

    const pk = PanelAppDynamoBuilder.getPanelContentPrimaryKey(panelId);

    const genesResponse = await this._client.send(
      new QueryCommand({
        TableName: PanelAppDynamoBuilder.TABLE_NAME,
        KeyConditionExpression: `${PanelAppDynamoBuilder.ATTRIBUTE_NAME_PRIMARY_KEY} = :pk`,
        ExpressionAttributeValues: {
          ':pk': { S: pk },
        },
      }),
    );

    for (const geneItem of genesResponse.Items) {
      genes.push({
        id: geneItem[PanelAppDynamoBuilder.ATTRIBUTE_NAME_SORT_KEY]['S'],
        symbol: geneItem[PanelAppDynamoBuilder.ATTRIBUTE_NAME_GENE_SYMBOL]['S'],
        confidence: parseInt(geneItem[PanelAppDynamoBuilder.ATTRIBUTE_NAME_GENE_PANEL_APP_CONFIDENCE]['N']),
        grch38Chr: geneItem[PanelAppDynamoBuilder.ATTRIBUTE_NAME_GENE_CHR]['S'],
        grch38Start: parseInt(geneItem[PanelAppDynamoBuilder.ATTRIBUTE_NAME_GENE_START]['N']),
        grch38End: parseInt(geneItem[PanelAppDynamoBuilder.ATTRIBUTE_NAME_GENE_END]['N']),
        grch38EnsemblRelease: geneItem[PanelAppDynamoBuilder.ATTRIBUTE_NAME_GENE_ENSEMBL_RELEASE]['S'],
        grch38EnsemblId: geneItem[PanelAppDynamoBuilder.ATTRIBUTE_NAME_GENE_ENSEMBL_ID]['S'],
      });
    }

    return genes;
  }
}
