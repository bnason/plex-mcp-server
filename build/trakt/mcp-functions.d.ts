/**
 * Trakt MCP Functions
 * MCP tool definitions and implementations for Trakt integration
 */
import { PlexAPIClient } from './sync.js';
export declare class TraktMCPFunctions {
    private plexClient;
    private traktClient;
    private syncEngine;
    private mapper;
    private isInitialized;
    constructor(plexClient: PlexAPIClient);
    /**
     * Get all watched movie titles from Trakt (for recommendation engine).
     * Returns null if Trakt is not configured/authenticated.
     */
    getWatchedMovieTitles(): Promise<Array<{
        title: string;
        year: number;
        plays: number;
    }> | null>;
    /**
     * Initialize Trakt client with configuration
     */
    private initializeTraktClient;
    /**
     * MCP Function: trakt_authenticate
     * Start OAuth authentication flow
     */
    traktAuthenticate(state?: string): Promise<Record<string, unknown>>;
    /**
     * MCP Function: trakt_complete_auth
     * Complete OAuth flow with authorization code
     */
    traktCompleteAuth(code: string): Promise<Record<string, unknown>>;
    /**
     * MCP Function: trakt_get_auth_status
     * Check current authentication status
     */
    traktGetAuthStatus(): Promise<Record<string, unknown>>;
    /**
     * MCP Function: trakt_sync_to_trakt
     * Sync Plex watch history to Trakt
     */
    traktSyncToTrakt(options?: {
        dryRun?: boolean;
        batchSize?: number;
        includeProgress?: boolean;
    }): Promise<Record<string, unknown>>;
    /**
     * MCP Function: trakt_sync_from_trakt
     * Get Trakt watch history for comparison
     */
    traktSyncFromTrakt(): Promise<Record<string, unknown>>;
    /**
     * MCP Function: trakt_get_user_stats
     * Get enhanced user statistics from Trakt
     */
    traktGetUserStats(userId?: number): Promise<Record<string, unknown>>;
    /**
     * MCP Function: trakt_start_scrobbling
     * Enable real-time scrobbling
     */
    traktStartScrobbling(sessionData: {
        ratingKey: string;
        title: string;
        type: 'movie' | 'episode';
        progress: number;
        duration?: number;
    }): Promise<Record<string, unknown>>;
    /**
     * MCP Function: trakt_get_sync_status
     * Check current sync status
     */
    traktGetSyncStatus(): Promise<Record<string, unknown>>;
    /**
     * MCP Function: trakt_search
     * Search for content on Trakt
     */
    traktSearch(query: string, type?: 'movie' | 'show', year?: number, limit?: number): Promise<Record<string, unknown>>;
}
