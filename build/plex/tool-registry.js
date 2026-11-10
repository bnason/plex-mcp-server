/**
 * Tool Registry — eliminates switch statements for tool dispatch.
 */
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { DEFAULT_LIMITS, isMutativeOpsEnabled, PLEX_MUTATIVE_OPS_ENV_VAR } from "./constants.js";
// Helper: wrap a handler to check mutative ops are enabled at runtime
function guardMutativeOp(handler) {
    return async (args) => {
        if (!isMutativeOpsEnabled()) {
            throw new McpError(ErrorCode.InvalidRequest, `Mutative operations are disabled. Enable with ${PLEX_MUTATIVE_OPS_ENV_VAR}=true`);
        }
        return handler(args);
    };
}
export class ToolRegistry {
    handlers = new Map();
    register(name, handler) {
        this.handlers.set(name, handler);
    }
    has(name) {
        return this.handlers.has(name);
    }
    async handle(name, args = {}) {
        const handler = this.handlers.get(name);
        if (!handler) {
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
        return handler(args);
    }
}
/** Pre-registers Plex tools; mutative tools are optional */
export function createPlexToolRegistry(tools, options = {}) {
    const registry = new ToolRegistry();
    registry.register("get_libraries", () => tools.getLibraries());
    registry.register("get_library_items", (args) => tools.getLibraryItems(args.libraryKey, args.type, args.limit || DEFAULT_LIMITS.libraryItems, args.offset || 0, args.sort, args.user, args.label));
    registry.register("export_library", (args) => tools.exportLibrary(args.libraryKey, args.type, args.outputPath, args.pageSize || DEFAULT_LIMITS.exportPageSize));
    registry.register("search_media", (args) => tools.searchMedia(args.query, args.type, args.libraryKey, args.limit || DEFAULT_LIMITS.searchMedia, args.offset || 0, args.user));
    registry.register("get_recently_added", (args) => tools.getRecentlyAdded(args.limit || DEFAULT_LIMITS.recentlyAdded, args.type, args.libraryKey));
    registry.register("get_on_deck", () => tools.getOnDeck());
    registry.register("get_media_details", (args) => tools.getMediaDetails(args.ratingKey, args.user));
    registry.register("get_editable_fields", (args) => tools.getEditableFields(args.ratingKey));
    registry.register("get_playlist_items", (args) => tools.getPlaylistItems(args.playlistId));
    registry.register("get_playlists", () => tools.getPlaylists());
    registry.register("get_watchlist", () => tools.getWatchlist());
    registry.register("get_active_sessions", () => tools.getActiveSessions());
    registry.register("get_recently_watched", (args) => tools.getRecentlyWatched(args.limit || DEFAULT_LIMITS.recentlyWatched, args.mediaType || "all"));
    registry.register("get_watch_history", (args) => tools.getWatchHistory(args.limit || DEFAULT_LIMITS.watchHistory, args.userId, args.mediaType || "all"));
    registry.register("get_fully_watched", (args) => tools.getFullyWatched(args.libraryKey, args.mediaType || "all", args.limit || DEFAULT_LIMITS.fullyWatched));
    registry.register("get_watch_stats", (args) => tools.getWatchStats(args.timeRange || 30, args.statType || "plays"));
    registry.register("get_user_stats", (args) => tools.getUserStats(args.timeRange || 30));
    registry.register("get_library_stats", (args) => tools.getLibraryStats(args.libraryKey));
    registry.register("get_popular_content", (args) => tools.getPopularContent(args.timeRange || 30, args.metric || "plays", args.mediaType || "all", args.limit || DEFAULT_LIMITS.popularContent));
    registry.register("get_recommendations", async (args) => {
        let qualityBias = 1.0;
        let traktWatchedTitles;
        if (options.traktFunctions && process.env.TRAKT_ACCESS_TOKEN) {
            try {
                // Fetch Trakt rating distribution for quality bias
                const statsResult = await options.traktFunctions.traktGetUserStats();
                const stats = statsResult?.stats;
                const traktStats = stats?.traktStats;
                const ratings = traktStats?.ratings;
                const dist = ratings?.distribution;
                if (dist) {
                    const totalRatings = Object.values(dist).reduce((a, b) => a + b, 0);
                    if (totalRatings > 0) {
                        const weightedSum = Object.entries(dist).reduce((sum, [rating, count]) => sum + Number(rating) * count, 0);
                        const avgRating = weightedSum / totalRatings;
                        qualityBias = avgRating < 6 ? 1.2 : avgRating > 8 ? 0.85 : 1.0;
                    }
                }
                // Fetch all Trakt watched movies to supplement Plex watch history
                const watchedMovies = await options.traktFunctions.getWatchedMovieTitles();
                if (watchedMovies) {
                    traktWatchedTitles = new Set(watchedMovies.map((m) => `${m.title.toLowerCase()}|${m.year}`));
                }
            }
            catch {
                // Trakt unavailable — silently use default
            }
        }
        return tools.getRecommendations(args.libraryKey, args.limit || DEFAULT_LIMITS.recommendations, args.userId, qualityBias, traktWatchedTitles);
    });
    // Always register mutative tools, but guard them at runtime
    registry.register("update_metadata", guardMutativeOp((args) => tools.updateMetadata({
        ratingKey: args.ratingKey,
        title: args.title,
        sortTitle: args.sortTitle,
        originalTitle: args.originalTitle,
        summary: args.summary,
        year: args.year,
        contentRating: args.contentRating,
        rating: args.rating,
        tagline: args.tagline,
        studio: args.studio,
        genres: args.genres,
        collections: args.collections,
        roles: args.roles,
        directors: args.directors,
        labels: args.labels,
    })));
    registry.register("update_metadata_from_json", guardMutativeOp((args) => tools.updateMetadataFromJson(args.ratingKey, args.metadata, args.setPosterFromUrl || false)));
    registry.register("create_playlist", guardMutativeOp((args) => tools.createPlaylist(args.title, args.type, {
        ratingKeys: args.ratingKeys,
        smart: args.smart,
        librarySectionId: args.librarySectionId,
        libtype: args.libtype,
        smartFilter: args.smartFilter,
    })));
    registry.register("add_to_playlist", guardMutativeOp((args) => tools.addToPlaylist(args.playlistId, args.ratingKey)));
    registry.register("remove_from_playlist", guardMutativeOp((args) => tools.removeFromPlaylist(args.playlistId, args.playlistItemId)));
    registry.register("clear_playlist", guardMutativeOp((args) => tools.clearPlaylist(args.playlistId, args.confirm || false)));
    registry.register("delete_playlist", guardMutativeOp((args) => tools.deletePlaylist(args.playlistId)));
    registry.register("add_to_watchlist", guardMutativeOp((args) => tools.addToWatchlist(args.ratingKey)));
    registry.register("remove_from_watchlist", guardMutativeOp((args) => tools.removeFromWatchlist({
        ratingKey: args.ratingKey,
        plexGuid: args.plexGuid,
    })));
    registry.register("mark_watched", guardMutativeOp((args) => tools.markWatched(args.ratingKey)));
    registry.register("mark_unwatched", guardMutativeOp((args) => tools.markUnwatched(args.ratingKey)));
    registry.register("rate_media", guardMutativeOp((args) => tools.rateMedia(args.ratingKey, args.rating)));
    return registry;
}
