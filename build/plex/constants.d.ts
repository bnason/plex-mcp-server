/**
 * Plex API constants and configuration defaults
 */
export declare const PLEX_TYPE_IDS: Record<string, number>;
/**
 * Type IDs for item kinds that can carry tags, sent as `type` with a tag edit
 * (PUT /library/sections/{id}/all). Plex answers a wrong type with 200 and writes
 * nothing, so every taggable kind needs its own id. A superset of PLEX_TYPE_IDS,
 * kept separate so the listing tools don't start accepting these kinds.
 * collection (18) confirmed against a live server on 2026-10-31 (#209); clip (12)
 * is python-plexapi's SEARCHTYPES (plexapi/utils.py; Clip has TYPE = 'clip').
 * No photo entry, on purpose: Plex reports photo albums as type "photo" too
 * (python-plexapi's Photoalbum has TYPE = 'photo' but edits with 'photoalbum', 14),
 * so item.type alone can't pick 13 or 14. A wrong id is a silent no-op, so photos
 * and albums keep failing loudly until that can be checked against a photo library.
 */
export declare const PLEX_TAGGABLE_TYPE_IDS: Record<string, number>;
/**
 * Numeric libtype IDs used inside smart playlist search URIs
 * (e.g. /library/sections/1/all?type=N). This is a superset of PLEX_TYPE_IDS
 * — it includes photoalbum/photo which are valid smart-playlist filter
 * targets but are not exposed elsewhere.
 */
export declare const SMART_PLAYLIST_LIBTYPE_IDS: Record<string, number>;
export declare const DEFAULT_LIMITS: {
    readonly recentlyAdded: 50;
    readonly recentlyWatched: 100;
    readonly watchHistory: 500;
    readonly fullyWatched: 500;
    readonly popularContent: 50;
    readonly libraryItems: 1000;
    readonly searchMedia: 500;
    readonly exportPageSize: 500;
    readonly recommendations: 10;
};
export declare const RECENCY_HALF_LIFE_DAYS = 180;
export declare const TASTE_TOP_GENRES = 10;
export declare const TASTE_TOP_DIRECTORS = 10;
export declare const TASTE_TOP_ACTORS = 20;
export declare const MIN_WATCHED_FOR_RECOMMENDATIONS = 5;
export declare const DEFAULT_PLEX_URL = "http://localhost:32400";
export declare const PLEX_CONTAINER_SIZE = 1000;
/** Safety stop for paged listings: 500 pages of PLEX_CONTAINER_SIZE is 500k items. */
export declare const PLEX_MAX_PAGES = 500;
/** Safety stop for listings filtered on our side (history by type, fully watched shows). */
export declare const PLEX_FILTERED_SCAN_MAX_PAGES = 50;
export declare const SUMMARY_PREVIEW_LENGTH = 500;
export declare const PLEX_MUTATIVE_OPS_ENV_VAR = "PLEX_ENABLE_MUTATIVE_OPS";
/** Standardized completion threshold (90%) — was inconsistent 85%/90% across codebase */
export declare const COMPLETION_THRESHOLD = 0.9;
/** Minimum duration (ms) before applying completion threshold logic.
 *  Content shorter than this is considered 'completed' if viewCount > 0.
 *  Prevents short trailers/clips from false-positive completion detection. */
export declare const MIN_COMPLETION_DURATION_MS: number;
export declare function isMutativeOpsEnabled(): boolean;
/**
 * Determine if item is completed, accounting for short-duration content.
 * Items shorter than MIN_COMPLETION_DURATION_MS require only viewCount > 0.
 * Longer items require progress >= COMPLETION_THRESHOLD, unless there is no
 * viewOffset: Plex omits it (or reports 0) once an item is finished, so viewCount > 0
 * alone then means completed.
 */
export declare function isContentCompleted(duration: number | undefined, viewOffset: number | undefined, viewCount: number | undefined): boolean;
