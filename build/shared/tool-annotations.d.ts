/**
 * MCP tool annotations (safety hints) applied to every advertised tool.
 *
 * Originally contributed by @warlyjr-cloud in #117.
 *
 * The MCP spec lets a server declare, per tool, whether it only reads
 * (`readOnlyHint`), whether it can irreversibly destroy data
 * (`destructiveHint`), and whether it touches an external system
 * (`openWorldHint`). Clients and approval UIs use these to decide how much
 * scrutiny a tool call needs. Without them every tool looks equally risky.
 *
 * ## Why the default is "not read-only"
 *
 * These hints are a safety signal, so the two possible misclassifications are
 * not symmetric:
 *
 *   - marking a read as a write → one unnecessary approval prompt
 *   - marking a write as a read → an approval UI runs it without asking
 *
 * Only the first is recoverable. So a tool is advertised as read-only *only*
 * when it appears in `READ_ONLY_TOOLS` below; anything unrecognised falls
 * through to "not read-only" and gets challenged. Forgetting to classify a new
 * tool is then merely noisy rather than dangerous.
 *
 * Naming conventions are not safe to infer from: `sonarr_search` queries
 * TheTVDB, but `sonarr_trigger_search` starts a download job.
 */
interface ToolSchema {
    name: string;
    description: string;
    inputSchema: unknown;
    annotations?: Record<string, unknown>;
}
/** A schema that is guaranteed to carry annotations. */
export type Annotated<T> = T & {
    annotations: Record<string, unknown>;
};
/**
 * Attach MCP annotations to each tool schema. Every tool here reaches Plex,
 * Trakt, or Sonarr/Radarr, so `openWorldHint` is always true.
 *
 * The return type states that `annotations` is present, so callers can read it
 * back without a cast — returning plain `T[]` would leave it optional even
 * though this function always sets it.
 */
export declare function withAnnotations<T extends ToolSchema>(schemas: readonly T[]): Annotated<T>[];
export {};
