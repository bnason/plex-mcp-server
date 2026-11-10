/**
 * Per-user views of the Plex server.
 *
 * The configured token belongs to the server owner, who sees everything. Home and
 * shared users see less: label restrictions, content ratings and shared libraries
 * all apply to their own server token. Plex.tv hands the owner each user's token
 * for this server (the same lookup python-plexapi's switchUser uses), so a read
 * made with that token returns exactly what the user would see.
 *
 * Tokens never leave this module: they are not returned by tools or put in errors.
 */
import type { PlexClient } from "./client.js";
/** Attributes of every <tag ...> element in a plex.tv XML document. */
export declare function xmlElements(xml: string, tag: string): Record<string, string>[];
export declare class PlexUsers {
    private client;
    private tokens;
    private machineIdentifier?;
    constructor(client: PlexClient);
    /**
     * The server token for a user, or undefined for the server owner (whose token the
     * client already uses). `user` is a plex.tv user id or a name, matched without case
     * against the user's display name and username.
     */
    tokenFor(user: string | number | undefined): Promise<string | undefined>;
    /** The owner's friends and Home users, as plex.tv lists them. */
    private users;
    /** Whether the name or id is the server owner (local account 1), who needs no switch. */
    private isOwner;
    private machine;
}
