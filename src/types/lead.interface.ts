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
    | 'busy'
    | 'answering-machine'
    | 'interested'
    | 'not-interested'
    | 'test-trial'
    | 'call-back'
    | 'on-board'
    | 'no-answer'
    | 'email/whatsApp-sent'
    | 'language-barrier'
    | 'invalid-number';

export interface IActivity {
    status: LeadStatus;
    notes?: string;
    nextAction?: 'follow-up' | 'send-proposal' | 'call-back' | 'close' | undefined;
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

    owner: string;
    activities?: IActivity[];
}
