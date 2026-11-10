/**
 * Trakt.tv API Client
 * Handles authentication, rate limiting, and API communication
 */
import { TraktConfig, TraktTokens, TraktUser, TraktMovie, TraktShow, TraktWatchedMovie, TraktWatchedShow, TraktScrobbleItem, TraktScrobbleResponse, TraktSyncRequest, TraktSyncResult, TraktUserStats, TraktProgress } from './types.js';
export interface TraktSearchResult {
    type: string;
    score: number;
    movie?: TraktMovie;
    show?: TraktShow;
}
export declare class TraktClient {
    private config;
    private http;
    private rateLimitDelay;
    private lastRequestTime;
    constructor(config: TraktConfig);
    private setupInterceptors;
    /**
     * Generate OAuth authorization URL
     */
    generateAuthUrl(state?: string): string;
    /**
     * Exchange authorization code for access token
     */
    exchangeCodeForToken(code: string): Promise<TraktTokens>;
    /**
     * Refresh access token using refresh token
     */
    refreshAccessToken(): Promise<TraktTokens>;
    /**
     * Get current user information
     */
    getCurrentUser(): Promise<TraktUser>;
    /**
     * Get user's watched movies
     */
    getWatchedMovies(): Promise<TraktWatchedMovie[]>;
    /**
     * Get user's watched shows
     */
    getWatchedShows(): Promise<TraktWatchedShow[]>;
    /**
     * Get user statistics
     */
    getUserStats(): Promise<TraktUserStats>;
    /**
     * Get watching progress
     */
    getWatchingProgress(): Promise<TraktProgress[]>;
    /**
     * Sync watched movies to Trakt
     */
    syncWatchedMovies(movies: TraktSyncRequest['movies']): Promise<TraktSyncResult>;
    /**
     * Sync watched shows to Trakt
     */
    syncWatchedShows(shows: TraktSyncRequest['shows']): Promise<TraktSyncResult>;
    /**
     * Sync watched episodes to Trakt
     */
    syncWatchedEpisodes(episodes: TraktSyncRequest['episodes']): Promise<TraktSyncResult>;
    /**
     * Start scrobbling (watching started)
     */
    scrobbleStart(item: TraktScrobbleItem): Promise<TraktScrobbleResponse>;
    /**
     * Pause scrobbling (watching paused)
     */
    scrobblePause(item: TraktScrobbleItem): Promise<TraktScrobbleResponse>;
    /**
     * Stop scrobbling (watching stopped/finished)
     */
    scrobbleStop(item: TraktScrobbleItem): Promise<TraktScrobbleResponse>;
    /**
     * Remove items from watch history
     */
    removeFromHistory(request: TraktSyncRequest): Promise<TraktSyncResult>;
    /**
     * Search for movies/shows on Trakt
     */
    search(query: string, type?: 'movie' | 'show', year?: number): Promise<TraktSearchResult[]>;
    /**
     * Get movie details by Trakt ID
     */
    getMovie(id: string | number): Promise<TraktMovie>;
    /**
     * Get show details by Trakt ID
     */
    getShow(id: string | number): Promise<TraktShow>;
    /**
     * Test API connection and authentication
     */
    testConnection(): Promise<{
        success: boolean;
        user?: TraktUser;
        error?: string;
    }>;
    /**
     * Update configuration (for token updates)
     */
    updateConfig(updates: Partial<TraktConfig>): void;
    /**
     * Get current configuration (excluding sensitive data)
     */
    getConfig(): Omit<TraktConfig, 'clientSecret' | 'accessToken' | 'refreshToken'>;
}
