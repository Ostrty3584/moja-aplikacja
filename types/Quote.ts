export type QuoteType =
    | "refresh"
    | "standard"
    | "complete";

export type QuoteStatus =
    | "new"
    | "sent"
    | "accepted"
    | "rejected";

export type Quote = {
    id: number;
    name: string;
    email: string;
    phone: string;
    area: number;
    rooms: number;
    type: QuoteType;
    price: number;
    debrisRemoval: boolean;
    created_at: string;
    status: QuoteStatus;
    notes: string | null;
};