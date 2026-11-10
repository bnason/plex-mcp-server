/**
 * Server version, read from package.json so the MCP handshake always reports
 * the published version instead of a hand-maintained copy.
 *
 * "../../package.json" resolves from both src/shared (tsx) and build/shared
 * (node), and package.json ships at the package root next to build/.
 */
export declare const SERVER_VERSION: string;
