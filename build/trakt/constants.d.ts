/**
 * Trakt API constants and configuration defaults
 */
export declare const DEFAULT_TRAKT_API_URL = "https://api.trakt.tv";
export declare const TRAKT_OAUTH_URL = "https://api.trakt.tv/oauth/authorize";
export declare const TRAKT_API_TIMEOUT = 10000;
export declare const TRAKT_INITIAL_RATE_LIMIT_DELAY = 1000;
export declare const TRAKT_DEFAULT_RETRY_AFTER = 60;
export declare const TRAKT_RATE_LIMIT_BACKOFF_MULTIPLIER = 2;
export declare const TRAKT_BATCH_DELAY_MS = 1000;
export declare const DEFAULT_BATCH_SIZE = 50;
export declare const INCREMENTAL_BATCH_SIZE = 25;
export declare const TRAKT_PREVIEW_LIMIT = 100;
export declare const ACHIEVEMENT_THRESHOLDS: {
    readonly movies: 100;
    readonly episodes: 1000;
    readonly hours: 100;
};
