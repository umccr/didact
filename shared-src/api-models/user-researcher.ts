import { DataUseLimitation } from "./data-use-limitation";

export type UserResearcherApiModel = {
    id: string;
    name: string;
    description: string;
    committeeId: string;
    committeeDisplayName: string;
    dataUses: DataUseLimitation[];
};
