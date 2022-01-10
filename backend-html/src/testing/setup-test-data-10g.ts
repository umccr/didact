
export type SingletonCase = {
  subjectId: string;
  sampleIds: string[];
  sex: 'M' | 'F';
  population:
    | /*british in england/scotland*/ 'GBR'
    | /*finnish in finland*/ 'FIN'
    | /*Chinese Dai in Xishuangbanna*/ 'CDX'
    | /*mende in sierra leone*/ 'MSL';
};

export const tengSingletons: SingletonCase[] = [
  {
    subjectId: 'SINGLETONCHARLES',
    sampleIds: ['HG00096'],
    sex: 'M',
    population: 'GBR',
  },
  {
    subjectId: 'SINGLETONMARY',
    sampleIds: ['HG00097'],
    sex: 'F',
    population: 'GBR',
  },
  {
    subjectId: 'SINGLETONJANE',
    sampleIds: ['HG00099'],
    sex: 'F',
    population: 'GBR',
  },
  {
    subjectId: 'SINGLETONKAARINA',
    sampleIds: ['HG00171'],
    sex: 'F',
    population: 'FIN',
  },
  {
    subjectId: 'SINGLETONANNELI',
    sampleIds: ['HG00173'],
    sex: 'F',
    population: 'FIN',
  },
  {
    subjectId: 'SINGLETONMARIA',
    sampleIds: ['HG00174'],
    sex: 'F',
    population: 'FIN',
  },
  {
    subjectId: 'SINGLETONMELE',
    sampleIds: ['HG01810'],
    sex: 'M',
    population: 'CDX',
  },
  {
    subjectId: 'SINGLETONPELANI',
    sampleIds: ['HG01811'],
    sex: 'M',
    population: 'CDX',
  },
  {
    subjectId: 'SINGLETONDEMBO',
    sampleIds: ['HG03432'],
    sex: 'M',
    population: 'MSL',
  },
  {
    subjectId: 'SINGLETONPAKUTEH',
    sampleIds: ['HG03433'],
    sex: 'M',
    population: 'MSL',
  },
];
