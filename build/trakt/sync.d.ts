/**
 * Trakt Sync Engine
 * Handles bidirectional synchronization between Plex and Trakt
 */
import { TraktClient } from './client.js';
import { PlexMovie, PlexEpisode, PlexWatchSession } from './mapper.js';
import { SyncResult, SyncOptions, TraktScrobbleResponse } from './types.js';
export interface PlexAPIClient {
    getWatchedMovies(userId?: number): Promise<PlexMovie[]>;
    getWatchedEpisodes(userId?: number): Promise<PlexEpisode[]>;
    getCurrentSessions(): Promise<PlexWatchSession[]>;
    markAsWatched(ratingKey: string, userId?: number): Promise<void>;
    updateProgress(ratingKey: string, progress: number, userId?: number): Promise<void>;
}
export declare class TraktSyncEngine {
    private traktClient;
    private plexClient;
    private mapper;
    private syncInProgress;
    private currentSyncId;
    constructor(traktClient: TraktClient, plexClient: PlexAPIClient);
    /**
     * Perform a full sync between Plex and Trakt
     */
    performFullSync(options?: Partial<SyncOptions>): Promise<SyncResult>;
    /**
     * Sync Plex watch history to Trakt
     */
    private syncPlexToTrakt;
    /**
     * Sync Trakt watch history to Plex (read-only comparison for now)
     */
    private syncTraktToPlex;
    /**
     * Perform incremental sync for recent changes
     */
    performIncrementalSync(since: Date, options?: Partial<SyncOptions>): Promise<SyncResult>;
    /**
     * Start real-time scrobbling session
     */
    startScrobbleSession(plexSession: PlexWatchSession): Promise<TraktScrobbleResponse | null>;
    /**
     * Update scrobble progress
     */
    updateScrobbleProgress(plexSession: PlexWatchSession): Promise<TraktScrobbleResponse | null>;
    /**
     * End scrobble session
     */
    endScrobbleSession(plexSession: PlexWatchSession): Promise<TraktScrobbleResponse | null>;
    /**
     * Get current sync status
     */
    getSyncStatus(): {
        inProgress: boolean;
        syncId: string | null;
        startedAt?: Date;
    };
    /**
     * Helper methods
     */
    private createEmptyResult;
    private mergeResults;
}
