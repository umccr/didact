import { DataUseLimitation } from '../../../shared-src/api-models/data-use-limitation';

export type SingletonCase = {
  subjectId: string;
  sampleIds: string[];
  sex: 'M' | 'F';
  population:
    | /*british in england/scotland*/ 'GBR'
    | /*finnish in finland*/ 'FIN'
    | /*Chinese Dai in Xishuangbanna*/ 'CDX'
    | /*mende in sierra leone*/ 'MSL';
  s3bam: string;
  s3vcf: string;
};

// #Family ID	Individual ID	Paternal ID	Maternal ID	Gender	Phenotype	Population	Relationship	Siblings	Second Order	Third Order	Children	Other Comments	phase 3 genotypes	related genotypes	omni genotypes	affy_genotypes
// HG00096	HG00096	0	0	1	0	GBR	unrel	0	0	0	0	0	1	0	1	1
// HG00097	HG00097	0	0	2	0	GBR	unrel	0	0	0	0	0	1	0	1	1
// HG00099	HG00099	0	0	2	0	GBR	unrel	0	0	0	0	0	1	0	1	1
// HG00171	HG00171	0	0	2	0	FIN	unrel	0	0	0	0	0	1	0	1	1
// HG00173	HG00173	0	0	2	0	FIN	unrel	0	0	0	0	0	1	0	1	1
// HG00174	HG00174	0	0	2	0	FIN	unrel	0	0	0	0	0	1	0	1	1
// HG01810	HG01810	0	0	1	0	CDX	unrel	0	0	0	0	0	1	0	1	1
// HG01811	HG01811	0	0	1	0	CDX	unrel	0	0	0	0	0	1	0	1	1
// HG03432	HG03432	0	0	1	0	MSL	unrel	0	0	0	0	0	1	0	0	1
// HG03433	HG03433	0	0	1	0	MSL	unrel	0	0	0	0	0	1	0	0	1

export const tengSingletons: SingletonCase[] = [
  {
    subjectId: 'SINGLETONCHARLES',
    sampleIds: ['HG00096'],
    sex: 'M',
    population: 'GBR',
    s3bam: 's3://umccr-10g-data-dev/HG00096/HG00096.bam',
    s3vcf: 's3://umccr-10g-data-dev/HG00096/HG00096.hard-filtered.vcf.gz',
  },
  {
    subjectId: 'SINGLETONMARY',
    sampleIds: ['HG00097'],
    sex: 'F',
    population: 'GBR',
    s3bam: 's3://umccr-10g-data-dev/HG00097/HG00097.bam',
    s3vcf: 's3://umccr-10g-data-dev/HG00097/HG00097.hard-filtered.vcf.gz',
  },
  {
    subjectId: 'SINGLETONJANE',
    sampleIds: ['HG00099'],
    sex: 'F',
    population: 'GBR',
    s3bam: 's3://umccr-10g-data-dev/HG00099/HG00099.bam',
    s3vcf: 's3://umccr-10g-data-dev/HG00099/HG00099.hard-filtered.vcf.gz',
  },
  {
    subjectId: 'SINGLETONKAARINA',
    sampleIds: ['HG00171'],
    sex: 'F',
    population: 'FIN',
    s3bam: 's3://umccr-10g-data-dev/HG00171/HG00171.bam',
    s3vcf: 's3://umccr-10g-data-dev/HG00171/HG00171.hard-filtered.vcf.gz',
  },
  {
    subjectId: 'SINGLETONANNELI',
    sampleIds: ['HG00173'],
    sex: 'F',
    population: 'FIN',
    s3bam: 's3://umccr-10g-data-dev/HG00173/HG00173.bam',
    s3vcf: 's3://umccr-10g-data-dev/HG00173/HG00173.hard-filtered.vcf.gz',
  },
  {
    subjectId: 'SINGLETONMARIA',
    sampleIds: ['HG00174'],
    sex: 'F',
    population: 'FIN',
    s3bam: 's3://umccr-10g-data-dev/HG00174/HG00174.bam',
    s3vcf: 's3://umccr-10g-data-dev/HG00174/HG00174.hard-filtered.vcf.gz',
  },
  {
    subjectId: 'SINGLETONMELE',
    sampleIds: ['HG01810'],
    sex: 'M',
    population: 'CDX',
    s3bam: 's3://umccr-10g-data-dev/HG01810/HG01810.bam',
    s3vcf: 's3://umccr-10g-data-dev/HG01810/HG01810.hard-filtered.vcf.gz',
  },
  {
    subjectId: 'SINGLETONPELANI',
    sampleIds: ['HG01811'],
    sex: 'M',
    population: 'CDX',
    s3bam: 's3://umccr-10g-data-dev/HG01811/HG01811.bam',
    s3vcf: 's3://umccr-10g-data-dev/HG01811/HG01811.hard-filtered.vcf.gz',
  },
  {
    subjectId: 'SINGLETONDEMBO',
    sampleIds: ['HG03432'],
    sex: 'M',
    population: 'MSL',
    s3bam: 's3://umccr-10g-data-dev/HG03432/HG03432.bam',
    s3vcf: 's3://umccr-10g-data-dev/HG03432/HG03432.hard-filtered.vcf.gz',
  },
  {
    subjectId: 'SINGLETONPAKUTEH',
    sampleIds: ['HG03433'],
    sex: 'M',
    population: 'MSL',
    s3bam: 's3://umccr-10g-data-dev/HG03433/HG03433.bam',
    s3vcf: 's3://umccr-10g-data-dev/HG03433/HG03433.hard-filtered.vcf.gz',
  },
];
