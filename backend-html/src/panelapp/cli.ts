import { PanelAppDynamoBuilder } from './panel-app-dynamo-builder';
import fs from 'fs';
import { unzip } from 'zlib';
import { promisify } from 'util';
import path from 'path';
import { PanelAppPanel, PanelAppPanelGene } from './panel-app-types';
import { PanelAppDynamoClient } from './panel-app-dynamo-client';

const fsPromises = fs.promises;
const do_unzip = promisify(unzip);

/**
 * Ok this is horrible - just a quick and dirty retrofit of some other panel app
 * loading code to work for making a dynamo db table.
 * TODO: proper cli
 *   error checking
 */
(async () => {
  const panelMap = new Map<number, PanelAppPanel>();

  const folder = process.argv[3];
  const files = await fsPromises.readdir(folder);

  for (const file of files) {
    const absolutePath = path.resolve(folder, file);

    const gzippedContent = await fsPromises.readFile(absolutePath);

    const panelReferenceData = await do_unzip(gzippedContent)
      .then(buf => JSON.parse(buf.toString()))
      .catch(err => {
        console.error('An error occurred:', err);
      });

    // assume we aren't going to include
    let include = false;

    for (const panelType of panelReferenceData.types) {
      if (['Australian Genomics'].includes(panelType['name'])) include = true;
    }

    if (!include) continue;

    // need to examine the stats to see if this is able to handled by our systems
    const stats = panelReferenceData.stats;

    // TO DISCUSS - HOW TO HANDLE STRS
    // AT THE MOMENT ANY STR DATA IS JUST THROWN OUT
    if (stats['number_of_strs'] > 0) {
      throw new Error(`Rejecting the load of ${panelReferenceData.name} because it contained strs and we can't handle`);
    }

    if (stats['number_of_regions'] > 0) {
      throw new Error(`Rejecting the load of ${panelReferenceData.name} because it contained regions and we can't handle regions yet`);
    }

    if (stats['number_of_genes'] > 0) {
      const p: PanelAppPanel = {
        id: panelReferenceData.id,
        name: panelReferenceData.name,
        version: panelReferenceData.version,
        genes: [],
      };

      // collate the genes that make up the panel from the more detailed response data
      for (const g of panelReferenceData.genes) {
        // find an ensembl id
        const grch38dict = g.gene_data.ensembl_genes['GRch38'];

        if (grch38dict) {
          if (Object.getOwnPropertyNames(grch38dict).length !== 1) throw Error('Ensembl Id for GRch38 had too many items');

          const location: string = Object.values(grch38dict)[0]['location'];

          const colonSplit = location.split(':');
          const dashSplit = colonSplit[1].split('-');

          const gData: PanelAppPanelGene = {
            id: g.gene_data.hgnc_id,
            symbol: g.gene_data.gene_symbol,
            confidence: parseInt(g.confidence_level),
            grch38Chr: colonSplit[0],
            grch38Start: parseInt(dashSplit[0]),
            grch38End: parseInt(dashSplit[1]),
            grch38EnsemblRelease: Object.getOwnPropertyNames(grch38dict)[0],
            grch38EnsemblId: Object.values(grch38dict)[0]['ensembl_id'],
          };

          p.genes.push(gData);
        } else {
          throw new Error(`MissingEnsembl${g.entity_name}`);
        }
      }

      panelMap.set(panelReferenceData.id, p);
    } else {
      throw new Error(`Rejecting the load of ${panelReferenceData.name} because it had no genes`);
    }
  }

  // await PanelAppDynamoBuilder.loadFromMap(panelMap);

  console.log(`Loaded all PanelApp data from folder ${folder}`);

  const client = new PanelAppDynamoClient();

  const all = await client.panelList();

  console.log(all);

  const search = await client.panelSearch('mitochondrial');

  console.log(search);

  const genes = await client.panelGenes(221);

  console.log(genes);
})();
