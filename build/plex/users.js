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
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
/** How long a looked-up token is reused before plex.tv is asked again. */
const TOKEN_TTL_MS = 10 * 60 * 1000;
/** Decodes the five XML entities plex.tv uses in attribute values. */
function decodeXml(value) {
    return value.replace(/&(quot|apos|lt|gt|amp);/g, (_, name) => ({ quot: '"', apos: "'", lt: "<", gt: ">", amp: "&" })[name]);
}
/** Attributes of every <tag ...> element in a plex.tv XML document. */
export function xmlElements(xml, tag) {
    const elements = [];
    for (const match of xml.matchAll(new RegExp(`<${tag}\\b([^>]*)>`, "g"))) {
        const attributes = {};
        for (const attribute of match[1].matchAll(/([A-Za-z_][\w.-]*)="([^"]*)"/g)) {
            attributes[attribute[1]] = decodeXml(attribute[2]);
        }
        elements.push(attributes);
    }
    return elements;
}
export class PlexUsers {
    client;
    tokens = new Map();
    machineIdentifier;
    constructor(client) {
        this.client = client;
    }
    /**
     * The server token for a user, or undefined for the server owner (whose token the
     * client already uses). `user` is a plex.tv user id or a name, matched without case
     * against the user's display name and username.
     */
    async tokenFor(user) {
        if (user === undefined || user === null || String(user).trim() === "")
            return undefined;
        const wanted = String(user).trim();
        if (await this.isOwner(wanted))
            return undefined;
        const users = await this.users();
        const byId = /^\d+$/.test(wanted) ? users.filter((u) => u.id === wanted) : [];
        const matches = byId.length
            ? byId
            : users.filter((u) => [u.title, u.username].some((name) => name && name.toLowerCase() === wanted.toLowerCase()));
        if (matches.length === 0) {
            const names = users.map((u) => u.title || u.username).filter(Boolean).join(", ");
            throw new McpError(ErrorCode.InvalidRequest, `Unknown Plex user "${wanted}". Users: ${names || "none"}`);
        }
        if (matches.length > 1) {
            throw new McpError(ErrorCode.InvalidRequest, `More than one Plex user is named "${wanted}". Pass their user id instead.`);
        }
        const id = matches[0].id;
        const cached = this.tokens.get(id);
        if (cached && cached.until > Date.now())
            return cached.token;
        const machine = await this.machine();
        const shared = xmlElements(await this.client.makePlexTvRequest(`/api/servers/${encodeURIComponent(machine)}/shared_servers`), "SharedServer");
        const token = shared.find((server) => server.userID === id)?.accessToken;
        if (!token) {
            throw new McpError(ErrorCode.InvalidRequest, `Plex did not provide access to this server for "${wanted}". The user may not have access, or the configured token is not the server owner's.`);
        }
        this.tokens.set(id, { token, until: Date.now() + TOKEN_TTL_MS });
        return token;
    }
    /** The owner's friends and Home users, as plex.tv lists them. */
    async users() {
        return xmlElements(await this.client.makePlexTvRequest("/api/users"), "User").map((user) => ({
            id: user.id ?? "",
            title: user.title ?? "",
            username: user.username ?? "",
        })).filter((user) => user.id);
    }
    /** Whether the name or id is the server owner (local account 1), who needs no switch. */
    async isOwner(wanted) {
        const data = (await this.client.makeRequest("/accounts"));
        const owner = data.MediaContainer?.Account?.find((account) => String(account.id) === "1");
        return !!owner && (wanted === "1" || (!!owner.name && owner.name.toLowerCase() === wanted.toLowerCase()));
    }
    async machine() {
        if (this.machineIdentifier)
            return this.machineIdentifier;
        const data = (await this.client.makeRequest("/identity"));
        const id = data.MediaContainer?.machineIdentifier;
        if (!id)
            throw new McpError(ErrorCode.InternalError, "Plex did not report its machine identifier");
        this.machineIdentifier = id;
        return id;
    }
}
