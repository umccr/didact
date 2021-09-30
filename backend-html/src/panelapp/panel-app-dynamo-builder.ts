import { BatchWriteItemCommand, DynamoDBClient, PutItemCommand, PutRequest } from '@aws-sdk/client-dynamodb';
import _ from 'lodash';
import { PanelAppPanel } from './panel-app-types';

export class PanelAppDynamoBuilder {
  // the partition duplicate spread is a value indicating how many times to 'duplicate' hot data
  // by introducing fake partition variance
  // So rather than storing hot (small) data once
  // PK = "abc" .. data ..
  //
  // we duplicate the data X times
  // PK = "abc#0" .. data ..
  // PK = "abc#1" .. data ..
  //
  // and then we access with random partition < X
  static PARTITION_DUPLICATE_SPREAD = 16;

  static TABLE_NAME = 'didact-reference-data';

  static ATTRIBUTE_NAME_PRIMARY_KEY = 'pk';
  static ATTRIBUTE_NAME_SORT_KEY = 'sk';

  static ATTRIBUTE_NAME_PANEL_APP_ID = 'panel-app-id';
  static ATTRIBUTE_NAME_PANEL_APP_VERSION = 'panel-app-version';

  static ATTRIBUTE_NAME_GENE_PANEL_APP_CONFIDENCE = 'gene-panel-app-confidence';
  static ATTRIBUTE_NAME_GENE_SYMBOL = 'gene-symbol';
  static ATTRIBUTE_NAME_GENE_CHR = 'gene-chr';
  static ATTRIBUTE_NAME_GENE_START = 'gene-start';
  static ATTRIBUTE_NAME_GENE_END = 'gene-end';
  static ATTRIBUTE_NAME_GENE_ENSEMBL_RELEASE = 'gene-ensembl-release';
  static ATTRIBUTE_NAME_GENE_ENSEMBL_ID = 'gene-ensembl-id';

  static PK_PREFIX_PANELNAME = 'PANELNAME-';
  static PK_PREFIX_PANELCONTENT = 'PANELCONTENT-';

  /**
   * Convert the in-memory representation of Panel App data into a highly optimised dynamodb table
   * structure.
   *
   * @param panelMap
   */
  public static async loadFromMap(panelMap: Map<number, PanelAppPanel>) {
    await this.createPanelNameEntries(panelMap);
    await this.createPanelContentEntries(panelMap);
  }

  private static createDynamoClient(): DynamoDBClient {
    // NOTE: if you get 'needs region' errors using this client - the correct thing (I think) to do is to
    // get AWS_REGION into your environment - not hard code the value here.
    // All _real_ AWS environments that we would run this code in _will_ have an AWS_REGION set
    return new DynamoDBClient({});
  }

  public static getRandomPartitionKey(prefix: string, secondary = ''): string {
    const p = Math.floor(Math.random() * PanelAppDynamoBuilder.PARTITION_DUPLICATE_SPREAD);

    return `${prefix}${secondary}#${p}`;
  }

  public static createConcretePartitionKey(prefix: string, secondary = '', value: number): string {
    return `${prefix}${secondary}#${value}`;
  }

  /**
   * Create duplicated entries across partitions with the string names of the panels,
   * so that we can quickly fetch the list of panels and do client searching
   * (there is not enough text search functionality in dynamodb to use that)
   *
   * @param panels
   * @private
   */
  private static async createPanelNameEntries(panels: Map<number, PanelAppPanel>) {
    const dynamoClient = PanelAppDynamoBuilder.createDynamoClient();

    // in order to avoid hotspots on the partition storing the names
    // we chose to replicate the name data into a number of partitions
    for (let i = 0; i < PanelAppDynamoBuilder.PARTITION_DUPLICATE_SPREAD; i++) {
      const nameItems = [...panels.entries()].map(([panelId, panel]) => {
        return {
          PutRequest: {
            Item: {
              [PanelAppDynamoBuilder.ATTRIBUTE_NAME_PRIMARY_KEY]: {
                S: `${PanelAppDynamoBuilder.PK_PREFIX_PANELNAME}#${i}`,
              },
              [PanelAppDynamoBuilder.ATTRIBUTE_NAME_SORT_KEY]: {
                S: panel.name,
              },
              [PanelAppDynamoBuilder.ATTRIBUTE_NAME_PANEL_APP_VERSION]: {
                S: panel.version,
              },
              // insanely - dynamodb requires number attributes to be passed as strings - which it converts to numbers
              [PanelAppDynamoBuilder.ATTRIBUTE_NAME_PANEL_APP_ID]: {
                N: panel.id.toString(),
              },
            },
          } as PutRequest,
        };
      });

      for (const nameBatch of _.chunk(nameItems, 25)) {
        await dynamoClient.send(
          new BatchWriteItemCommand({
            RequestItems: {
              [PanelAppDynamoBuilder.TABLE_NAME]: nameBatch,
            },
          }),
        );
      }
    }
  }

  public static getPanelContentPrimaryKey(panelId: number) {
    return `${PanelAppDynamoBuilder.PK_PREFIX_PANELCONTENT}${panelId}`;
  }

  /**
   * Create dynamo db entries with the sets of gene and ensembl genes for each
   * panel. Unlike other content - this content is just stored once for each panel
   * (as it will naturally be dispersed access across dynamo)
   *
   * @param panels
   * @private
   */
  private static async createPanelContentEntries(panels: Map<number, PanelAppPanel>) {
    const dynamoClient = PanelAppDynamoBuilder.createDynamoClient();

    for (const [panelId, panel] of panels.entries()) {
      for (const g of panel.genes) {
        console.log(`Inserting ${JSON.stringify(g)}`);
        const insertResult = await dynamoClient.send(
          new PutItemCommand({
            TableName: PanelAppDynamoBuilder.TABLE_NAME,
            Item: {
              [PanelAppDynamoBuilder.ATTRIBUTE_NAME_PRIMARY_KEY]: {
                S: this.getPanelContentPrimaryKey(panelId),
              },
              [PanelAppDynamoBuilder.ATTRIBUTE_NAME_SORT_KEY]: { S: g.id },
              [PanelAppDynamoBuilder.ATTRIBUTE_NAME_GENE_PANEL_APP_CONFIDENCE]: {
                N: g.confidence.toString(),
              },
              [PanelAppDynamoBuilder.ATTRIBUTE_NAME_GENE_SYMBOL]: {
                S: g.symbol,
              },
              [PanelAppDynamoBuilder.ATTRIBUTE_NAME_GENE_CHR]: {
                S: g.grch38Chr,
              },
              [PanelAppDynamoBuilder.ATTRIBUTE_NAME_GENE_START]: {
                N: g.grch38Start.toString(),
              },
              [PanelAppDynamoBuilder.ATTRIBUTE_NAME_GENE_END]: {
                N: g.grch38End.toString(),
              },
              [PanelAppDynamoBuilder.ATTRIBUTE_NAME_GENE_ENSEMBL_RELEASE]: {
                S: g.grch38EnsemblRelease,
              },
              [PanelAppDynamoBuilder.ATTRIBUTE_NAME_GENE_ENSEMBL_ID]: {
                S: g.grch38EnsemblId,
              },
            },
          }),
        );
        console.log(insertResult);
      }
    }
  }
}
