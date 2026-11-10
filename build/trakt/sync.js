/**
 * Trakt Sync Engine
 * Handles bidirectional synchronization between Plex and Trakt
 */
import { PlexToTraktMapper } from './mapper.js';
import { sleep, chunkArray } from '../shared/utils.js';
import { DEFAULT_BATCH_SIZE, INCREMENTAL_BATCH_SIZE, TRAKT_BATCH_DELAY_MS } from './constants.js';
export class TraktSyncEngine {
    traktClient;
    plexClient;
    mapper;
    syncInProgress = false;
    currentSyncId = null;
    constructor(traktClient, plexClient) {
        this.traktClient = traktClient;
        this.plexClient = plexClient;
        this.mapper = new PlexToTraktMapper();
    }
    /**
     * Perform a full sync between Plex and Trakt
     */
    async performFullSync(options = {}) {
        const syncOptions = {
            direction: 'plex-to-trakt',
            dryRun: false,
            autoResolveConflicts: true,
            includeProgress: false,
            syncRatings: false,
            batchSize: DEFAULT_BATCH_SIZE,
            ...options
        };
        if (this.syncInProgress) {
            throw new Error('Sync already in progress');
        }
        this.syncInProgress = true;
        this.currentSyncId = `sync_${Date.now()}`;
        const startTime = new Date();
        let result = {
            success: false,
            itemsProcessed: 0,
            itemsAdded: 0,
            itemsUpdated: 0,
            itemsFailed: 0,
            conflicts: [],
            errors: [],
            startTime,
            endTime: new Date(),
            duration: 0
        };
        try {
            console.log(`Starting full sync (${syncOptions.direction}, dry-run: ${syncOptions.dryRun})`);
            if (syncOptions.direction === 'plex-to-trakt' || syncOptions.direction === 'bidirectional') {
                const plexToTraktResult = await this.syncPlexToTrakt(syncOptions);
                this.mergeResults(result, plexToTraktResult);
            }
            if (syncOptions.direction === 'trakt-to-plex' || syncOptions.direction === 'bidirectional') {
                const traktToPlexResult = await this.syncTraktToPlex(syncOptions);
                this.mergeResults(result, traktToPlexResult);
            }
            result.success = result.errors.length === 0 || result.itemsProcessed > 0;
            console.log(`Sync completed: ${result.itemsProcessed} processed, ${result.itemsAdded} added, ${result.errors.length} errors`);
        }
        catch (error) {
            result.errors.push(error instanceof Error ? error.message : 'Unknown error');
            console.error('Sync failed:', error);
        }
        finally {
            result.endTime = new Date();
            result.duration = result.endTime.getTime() - result.startTime.getTime();
            this.syncInProgress = false;
            this.currentSyncId = null;
        }
        return result;
    }
    /**
     * Sync Plex watch history to Trakt
     */
    async syncPlexToTrakt(options) {
        const result = this.createEmptyResult();
        try {
            // Get Plex watched movies
            console.log('Fetching Plex watched movies...');
            const plexMovies = await this.plexClient.getWatchedMovies();
            console.log(`Found ${plexMovies.length} watched movies in Plex`);
            // Validate and convert movies (dedupe by GUID to avoid double-scrobble of multi-version items)
            const seenMovieGuids = new Set();
            const validMovies = plexMovies.filter(movie => {
                const validation = this.mapper.validatePlexItemForSync(movie);
                if (!validation.valid) {
                    result.errors.push(`Movie "${movie.title}": ${validation.errors.join(', ')}`);
                    result.itemsFailed++;
                    return false;
                }
                const dedupeKey = movie.guid ?? `${movie.title}::${movie.year ?? ''}`;
                if (seenMovieGuids.has(dedupeKey))
                    return false;
                seenMovieGuids.add(dedupeKey);
                return true;
            });
            // Sync movies in batches
            if (validMovies.length > 0 && !options.dryRun) {
                const movieBatches = chunkArray(validMovies, options.batchSize);
                for (const batch of movieBatches) {
                    try {
                        const traktMovies = this.mapper.mapPlexMoviesForSync(batch);
                        const syncResult = await this.traktClient.syncWatchedMovies(traktMovies);
                        result.itemsProcessed += batch.length;
                        result.itemsAdded += syncResult.added.movies;
                        console.log(`Synced batch of ${batch.length} movies: ${syncResult.added.movies} added, ${syncResult.existing.movies} existing`);
                        // Handle not found items
                        if (syncResult.not_found.movies.length > 0) {
                            syncResult.not_found.movies.forEach(movie => {
                                result.errors.push(`Movie not found on Trakt: ${movie.title} (${movie.year})`);
                                result.itemsFailed++;
                            });
                        }
                    }
                    catch (error) {
                        result.errors.push(`Failed to sync movie batch: ${error}`);
                        result.itemsFailed += batch.length;
                    }
                    // Small delay between batches to respect rate limits
                    await sleep(TRAKT_BATCH_DELAY_MS);
                }
            }
            // Get Plex watched episodes
            console.log('Fetching Plex watched episodes...');
            const plexEpisodes = await this.plexClient.getWatchedEpisodes();
            console.log(`Found ${plexEpisodes.length} watched episodes in Plex`);
            // Validate and convert episodes (dedupe by GUID; falls back to show+S/E composite key)
            const seenEpisodeGuids = new Set();
            const validEpisodes = plexEpisodes.filter(episode => {
                const validation = this.mapper.validatePlexItemForSync(episode);
                if (!validation.valid) {
                    result.errors.push(`Episode "${episode.title}": ${validation.errors.join(', ')}`);
                    result.itemsFailed++;
                    return false;
                }
                const dedupeKey = episode.guid ??
                    `${episode.show?.title ?? ''}::S${episode.seasonNumber}E${episode.episodeNumber}`;
                if (seenEpisodeGuids.has(dedupeKey))
                    return false;
                seenEpisodeGuids.add(dedupeKey);
                return true;
            });
            // Sync episodes
            if (validEpisodes.length > 0 && !options.dryRun) {
                try {
                    const traktShows = this.mapper.mapPlexEpisodesForSync(validEpisodes);
                    const syncResult = await this.traktClient.syncWatchedShows(traktShows);
                    result.itemsProcessed += validEpisodes.length;
                    result.itemsAdded += syncResult.added.episodes;
                    console.log(`Synced ${validEpisodes.length} episodes: ${syncResult.added.episodes} added, ${syncResult.existing.episodes} existing`);
                    // Handle not found items
                    if (syncResult.not_found.episodes.length > 0) {
                        syncResult.not_found.episodes.forEach(episode => {
                            result.errors.push(`Episode not found on Trakt: ${episode.title}`);
                            result.itemsFailed++;
                        });
                    }
                }
                catch (error) {
                    result.errors.push(`Failed to sync episodes: ${error}`);
                    result.itemsFailed += validEpisodes.length;
                }
            }
            if (options.dryRun) {
                console.log(`Dry run complete: ${validMovies.length} movies and ${validEpisodes.length} episodes would be synced`);
                result.itemsProcessed = validMovies.length + validEpisodes.length;
            }
        }
        catch (error) {
            result.errors.push(`Plex to Trakt sync failed: ${error}`);
        }
        return result;
    }
    /**
     * Sync Trakt watch history to Plex (read-only comparison for now)
     */
    async syncTraktToPlex(options) {
        const result = this.createEmptyResult();
        try {
            console.log('Fetching Trakt watched movies...');
            const traktMovies = await this.traktClient.getWatchedMovies();
            console.log(`Found ${traktMovies.length} watched movies on Trakt`);
            console.log('Fetching Trakt watched shows...');
            const traktShows = await this.traktClient.getWatchedShows();
            console.log(`Found ${traktShows.length} watched shows on Trakt`);
            // For now, just report what we found - full bidirectional sync would require
            // more complex matching and Plex write operations
            result.itemsProcessed = traktMovies.length + traktShows.length;
            if (options.dryRun) {
                console.log('Trakt to Plex sync (read-only): comparison completed');
            }
            else {
                result.errors.push('Trakt to Plex sync not yet implemented - use for comparison only');
            }
        }
        catch (error) {
            result.errors.push(`Trakt to Plex sync failed: ${error}`);
        }
        return result;
    }
    /**
     * Perform incremental sync for recent changes
     */
    async performIncrementalSync(since, options = {}) {
        console.log(`Starting incremental sync since ${since.toISOString()}`);
        // For now, just perform a full sync - a real implementation would
        // filter items by lastViewedAt/updatedAt timestamps
        return this.performFullSync({
            ...options,
            batchSize: INCREMENTAL_BATCH_SIZE
        });
    }
    /**
     * Start real-time scrobbling session
     */
    async startScrobbleSession(plexSession) {
        if (!plexSession.duration) {
            console.warn('Cannot scrobble session without duration');
            return null;
        }
        try {
            const scrobbleItem = this.mapper.mapPlexWatchSessionToScrobble(plexSession);
            const response = await this.traktClient.scrobbleStart(scrobbleItem);
            console.log(`Started scrobbling: ${plexSession.title} (${response.progress}%)`);
            return response;
        }
        catch (error) {
            console.error(`Failed to start scrobbling: ${error}`);
            return null;
        }
    }
    /**
     * Update scrobble progress
     */
    async updateScrobbleProgress(plexSession) {
        if (!plexSession.duration || !plexSession.viewOffset) {
            return null;
        }
        try {
            const scrobbleItem = this.mapper.mapPlexWatchSessionToScrobble(plexSession);
            const response = plexSession.state === 'paused'
                ? await this.traktClient.scrobblePause(scrobbleItem)
                : await this.traktClient.scrobbleStart(scrobbleItem); // Continue watching
            console.log(`Updated scrobble progress: ${plexSession.title} (${response.progress}%)`);
            return response;
        }
        catch (error) {
            console.error(`Failed to update scrobble progress: ${error}`);
            return null;
        }
    }
    /**
     * End scrobble session
     */
    async endScrobbleSession(plexSession) {
        if (!plexSession.duration) {
            return null;
        }
        try {
            const scrobbleItem = this.mapper.mapPlexWatchSessionToScrobble(plexSession);
            const response = await this.traktClient.scrobbleStop(scrobbleItem);
            console.log(`Ended scrobbling: ${plexSession.title} (${response.progress}%)`);
            return response;
        }
        catch (error) {
            console.error(`Failed to end scrobbling: ${error}`);
            return null;
        }
    }
    /**
     * Get current sync status
     */
    getSyncStatus() {
        return {
            inProgress: this.syncInProgress,
            syncId: this.currentSyncId
        };
    }
    /**
     * Helper methods
     */
    createEmptyResult() {
        return {
            success: false,
            itemsProcessed: 0,
            itemsAdded: 0,
            itemsUpdated: 0,
            itemsFailed: 0,
            conflicts: [],
            errors: [],
            startTime: new Date(),
            endTime: new Date(),
            duration: 0
        };
    }
    mergeResults(target, source) {
        target.itemsProcessed += source.itemsProcessed;
        target.itemsAdded += source.itemsAdded;
        target.itemsUpdated += source.itemsUpdated;
        target.itemsFailed += source.itemsFailed;
        target.conflicts.push(...source.conflicts);
        target.errors.push(...source.errors);
    }
}
