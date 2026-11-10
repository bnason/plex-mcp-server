/**
 * Trakt Tool Registry — eliminates switch statement for Trakt tool dispatch.
 * Reuses ToolRegistry class from plex/tool-registry.ts.
 */
import { ToolRegistry } from "../plex/tool-registry.js";
import { formatToolPayload } from "../shared/output-format.js";
export function createTraktToolRegistry(traktFunctions) {
    const registry = new ToolRegistry();
    registry.register("trakt_authenticate", (args) => traktFunctions.traktAuthenticate(args.state).then(wrapResponse));
    registry.register("trakt_complete_auth", (args) => traktFunctions.traktCompleteAuth(args.code).then(wrapResponse));
    registry.register("trakt_get_auth_status", () => traktFunctions.traktGetAuthStatus().then(wrapResponse));
    registry.register("trakt_sync_to_trakt", (args) => traktFunctions.traktSyncToTrakt({
        dryRun: args.dryRun,
        batchSize: args.batchSize,
        includeProgress: args.includeProgress,
    }).then(wrapResponse));
    registry.register("trakt_sync_from_trakt", () => traktFunctions.traktSyncFromTrakt().then(wrapResponse));
    registry.register("trakt_get_user_stats", (args) => traktFunctions.traktGetUserStats(args.userId).then(wrapResponse));
    registry.register("trakt_start_scrobbling", (args) => traktFunctions.traktStartScrobbling({
        ratingKey: args.ratingKey,
        title: args.title,
        type: args.type,
        progress: args.progress,
        duration: args.duration,
    }).then(wrapResponse));
    registry.register("trakt_get_sync_status", () => traktFunctions.traktGetSyncStatus().then(wrapResponse));
    registry.register("trakt_search", (args) => traktFunctions.traktSearch(args.query, args.type, args.year, args.limit).then(wrapResponse));
    return registry;
}
function wrapResponse(data) {
    return { content: [{ type: "text", text: formatToolPayload(data) }] };
}
