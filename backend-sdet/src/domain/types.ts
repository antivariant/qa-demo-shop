export interface SdetUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    name: string;
    bugsEnabled: number;
    bugsFound: number;
    createdAt: string;
    updatedAt: string;
}
