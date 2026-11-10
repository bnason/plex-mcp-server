/**
 * Plex tool implementations.
 * All Plex MCP tools with typed args and no `as any` casts.
 */
import { PlexClient } from "./client.js";
import { MCPResponse } from "./types.js";
type MetadataUpdateInput = {
    ratingKey: string;
    title?: string;
    sortTitle?: string;
    originalTitle?: string;
    summary?: string;
    year?: number;
    contentRating?: string;
    rating?: number;
    tagline?: string;
    studio?: string;
    genres?: unknown[];
    collections?: unknown[];
    roles?: unknown[];
    directors?: unknown[];
    labels?: unknown[];
};
export declare class PlexTools {
    private client;
    private machineIdentifier?;
    constructor(client: PlexClient);
    getLibraries(): Promise<MCPResponse>;
    getLibraryItems(libraryKey: string, type?: string, limit?: number, offset?: number, sort?: string): Promise<MCPResponse>;
    exportLibrary(libraryKey: string, type?: string, outputPath?: string, pageSize?: number): Promise<MCPResponse>;
    searchMedia(query: string, type?: string, libraryKey?: string, limit?: number, offset?: number): Promise<MCPResponse>;
    getPlaylists(): Promise<MCPResponse>;
    getPlaylistItems(playlistId: string): Promise<MCPResponse>;
    getWatchlist(): Promise<MCPResponse>;
    getEditableFields(ratingKey: string): Promise<MCPResponse>;
    getRecentlyAdded(limit?: number, type?: string, libraryKey?: string): Promise<MCPResponse>;
    getOnDeck(): Promise<MCPResponse>;
    getActiveSessions(): Promise<MCPResponse>;
    getMediaDetails(ratingKey: string): Promise<MCPResponse>;
    updateMetadata(input: MetadataUpdateInput): Promise<MCPResponse>;
    updateMetadataFromJson(ratingKey: string, metadata: Record<string, unknown>, setPosterFromUrl?: boolean): Promise<MCPResponse>;
    createPlaylist(title: string, type: string, options?: {
        ratingKeys?: string[];
        smart?: boolean;
        librarySectionId?: string;
        libtype?: string;
        smartFilter?: string;
    }): Promise<MCPResponse>;
    addToPlaylist(playlistId: string, ratingKey: string): Promise<MCPResponse>;
    removeFromPlaylist(playlistId: string, playlistItemId: string): Promise<MCPResponse>;
    clearPlaylist(playlistId: string, confirm?: boolean): Promise<MCPResponse>;
    deletePlaylist(playlistId: string): Promise<MCPResponse>;
    addToWatchlist(ratingKey: string): Promise<MCPResponse>;
    removeFromWatchlist(input: string | {
        ratingKey?: string;
        plexGuid?: string;
    }): Promise<MCPResponse>;
    markWatched(ratingKey: string): Promise<MCPResponse>;
    markUnwatched(ratingKey: string): Promise<MCPResponse>;
    rateMedia(ratingKey: string, rating: number): Promise<MCPResponse>;
    getRecentlyWatched(limit?: number, mediaType?: string): Promise<MCPResponse>;
    /**
     * Page through a listing, keeping rows that pass `keep`, until `limit` are kept or the
     * listing ends. For filters Plex can't apply itself. Stops on a short page, on Plex's
     * totalSize, on a page identical to the last (Plex ignored the offset), or after
     * PLEX_FILTERED_SCAN_MAX_PAGES. The last two are reported as scanCapped, since the
     * listing may hold more matches.
     */
    private collectFiltered;
    /**
     * Session history from Plex's history endpoint, as data. Throws if the
     * endpoint fails; callers choose their own fallback. Callers that need data
     * use this and not getWatchHistory, whose text may be TOON instead of JSON.
     */
    private fetchWatchHistory;
    getWatchHistory(limit?: number, userId?: string, mediaType?: string): Promise<MCPResponse>;
    getFullyWatched(libraryKey?: string, mediaType?: string, limit?: number): Promise<MCPResponse>;
    getWatchStats(timeRange?: number, statType?: string): Promise<MCPResponse>;
    getUserStats(timeRange?: number): Promise<MCPResponse>;
    getLibraryStats(libraryKey?: string): Promise<MCPResponse>;
    getPopularContent(timeRange?: number, metric?: string, mediaType?: string, limit?: number): Promise<MCPResponse>;
    private writeToStream;
    private finishStream;
    private requireMutativeOpsEnabled;
    private getErrorMessage;
    private parseResponseText;
    private normalizeTagList;
    private replaceTagsSafely;
    private isFieldLocked;
    private getCurrentTags;
    private editTagsForItem;
    private getTaggableTypeId;
    private buildTagParams;
    private getMediaContext;
    private getPlexGuid;
    private validatePlexGuid;
    private getGlobalRatingKey;
    private setPosterFromUrl;
    private getMachineIdentifier;
    private isItemInPlaylist;
    private getPlaylistType;
    /**
     * Default libtype for a smart playlist when the caller didn't specify one.
     * Maps the outer playlist type to a sensible leaf content type.
     */
    private defaultLibtypeFor;
    private getRecentlyWatchedFromLibraries;
    private getWatchHistoryFromLibraries;
    private getFullyWatchedFromLibraries;
    private getBasicStats;
    private calculatePlayStats;
    private calculateDurationStats;
    private calculateUserStats;
    private calculateLibraryStats;
    private calculatePlatformStats;
    getRecommendations(libraryKey: string, limit?: number, userId?: string, qualityBias?: number, traktWatchedTitles?: Set<string>): Promise<MCPResponse>;
    private buildTasteProfile;
    private scoreMovie;
    private applyDiversityPenalty;
}
export {};
