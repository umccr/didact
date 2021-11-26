import { DataUseLimitation } from "./data-use-limitation";

export type DatasetApiModel = {
    id: string;
    name: string;
    description: string;
    committeeId: string;
    committeeDisplayName: string;
    dataUses: DataUseLimitation[];
    // if explicitly asked for, dataset can also include details of all the subjects/samples contained within
    subjects?: { [id: string]: DatasetApiSubjectModel };
};

export type DatasetApiSubjectModel = {
    sampleIds: string[];
    familyId?: string;
    dataUse?: DataUseLimitation;
}
