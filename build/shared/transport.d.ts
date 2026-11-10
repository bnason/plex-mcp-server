/**
 * Shared transport factory for MCP servers.
 * Supports stdio (default) and HTTP transports via --transport flag.
 *
 * Multi-session HTTP mode: each client connection gets its own
 * StreamableHTTPServerTransport backed by its own Server instance, keyed by
 * session ID. A single Server cannot back multiple transports — its
 * initialization state is per-connection — so sharing one across clients makes
 * the second client fail with "already initialized".
 */
import { type IncomingMessage, type ServerResponse } from "node:http";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
/** URL path the MCP endpoint is served on unless --path or MCP_PATH says otherwise. */
export declare const DEFAULT_MCP_PATH = "/mcp";
/** Largest accepted JSON-RPC request body. Guards against memory exhaustion
 *  from an unauthenticated POST to the MCP path. */
export declare const DEFAULT_MAX_BODY_BYTES: number;
/** Close a session after this long with no traffic. */
export declare const DEFAULT_SESSION_IDLE_MS = 300000;
/** Ceiling on concurrent sessions. Each session holds a Server instance, so
 *  this bounds memory against a client that never reuses its session ID. */
export declare const DEFAULT_MAX_SESSIONS = 64;
/** How often the idle sweeper runs. */
export declare const SESSION_SWEEP_INTERVAL_MS = 30000;
export declare class BodyTooLargeError extends Error {
    constructor(limit: number);
}
export declare class SessionLimitError extends Error {
    constructor(limit: number);
}
/**
 * Read a request body, refusing anything over `maxBytes`.
 *
 * Length is tracked in bytes across chunks rather than trusting
 * Content-Length, which a client controls and may understate.
 */
export declare function readBody(req: IncomingMessage, maxBytes: number): Promise<string>;
/** The subset of StreamableHTTPServerTransport the store depends on. */
interface SessionTransport {
    sessionId?: string;
    close(): Promise<void>;
    onclose?: (() => void) | undefined;
}
export interface SessionStoreOptions {
    maxSessions?: number;
    idleTimeoutMs?: number;
    /** Injectable clock — keeps idle-expiry behaviour testable. */
    now?: () => number;
}
/**
 * Tracks live HTTP sessions and expires idle ones.
 *
 * A single sweeper timer scans the map rather than one timer per session:
 * per-session timers leak whenever a session is dropped by a path that does
 * not own its timer.
 */
export declare class SessionStore {
    private readonly sessions;
    private readonly maxSessions;
    private readonly idleTimeoutMs;
    private readonly now;
    private sweeper?;
    constructor(options?: SessionStoreOptions);
    get size(): number;
    isFull(): boolean;
    has(id: string): boolean;
    /** Register a session. Throws SessionLimitError when at capacity. */
    add(transport: SessionTransport): void;
    /** Look up a session, recording the lookup as activity. */
    get(id: string): SessionTransport | undefined;
    close(id: string): void;
    /** Close every session idle beyond the timeout. Returns the closed IDs. */
    sweep(): string[];
    closeAll(): void;
    startSweeper(intervalMs?: number): void;
    stopSweeper(): void;
}
/**
 * Validate a configured MCP path and strip any trailing slash, so "/plex/" and
 * "/plex" serve the same endpoint. Throws on anything that is not a plain path.
 * Non-ASCII is refused because request paths arrive percent-encoded, so a
 * configured "/plëx" could never match.
 */
export declare function normalizeMcpPath(raw: string): string;
export interface McpHandlerOptions {
    /** Called once per new session to build a dedicated Server instance. */
    getServer: () => Server;
    serverName: string;
    store: SessionStore;
    maxBodyBytes?: number;
    /** Path the MCP endpoint is served on. Defaults to DEFAULT_MCP_PATH. */
    mcpPath?: string;
}
/**
 * Build the node:http request handler for HTTP transport mode.
 *
 * Exposed separately from startServer so it can be exercised against an
 * ephemeral port without going through argv parsing.
 */
export declare function createMcpRequestHandler(options: McpHandlerOptions): (req: IncomingMessage, res: ServerResponse) => Promise<void>;
/**
 * Start the server on the transport selected by argv.
 *
 * Takes a factory rather than an instance: HTTP mode needs a fresh Server per
 * session, and only the caller knows how to build one.
 */
export declare function startServer(getServer: () => Server, serverName: string): Promise<void>;
export {};
