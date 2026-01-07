export interface ICompany {
    name: string;
    website: string;
}

export interface IContactPerson {
    firstName?: string;
    lastName?: string;
    designation?: string;
    emails: string[];
    phones: string[];
}

export type LeadStatus =
    | 'all'
    | 'new'
    | 'answering-machine'
    | 'interested'
    | 'not-interested'
    | 'test-trial'
    | 'call-back'
    | 'on-board'
    | 'language-barrier'
    | 'invalid-number';

export type LeadSource = 'manual' | 'imported' | 'website';

export interface IImportBatch {
    batchId: string;
    importedAt: string;
    importedBy: string;
    fileName?: string;
    totalCount?: number;
}

export interface IActivity {
    status: LeadStatus;
    notes?: string;
    nextAction?:
        | 'follow-up'
        | 'send-proposal'
        | 'call-back'
        | 'close'
        | undefined;
    dueAt?: Date;
    byUser: { firstName?: string; lastName?: string };
    at: Date;
}

export interface ILead {
    _id: string;
    company: ICompany;
    address?: string;
    country: string;
    notes?: string;

    contactPersons: IContactPerson[];
    status: LeadStatus;
    group?: { _id: string; name: string; color?: string } | null;

    source?: LeadSource;
    importBatch?: IImportBatch;

    owner: string;
    activities?: IActivity[];
}
