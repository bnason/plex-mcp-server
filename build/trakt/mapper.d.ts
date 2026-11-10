/**
 * Data Mapping Layer between Plex and Trakt formats
 * Converts Plex API responses to Trakt API format and vice versa
 */
import { TraktMovie, TraktShow, TraktEpisode, TraktScrobbleItem, TraktSyncRequest, TraktIds } from './types.js';
export interface PlexMovie {
    ratingKey: string;
    title: string;
    year?: number;
    guid?: string;
    Guid?: {
        id: string;
    }[];
    imdbId?: string;
    tmdbId?: string;
    duration?: number;
    viewCount?: number;
    lastViewedAt?: number;
    addedAt?: number;
    updatedAt?: number;
    genres?: string[];
    summary?: string;
}
export interface PlexShow {
    ratingKey: string;
    title: string;
    year?: number;
    guid?: string;
    Guid?: {
        id: string;
    }[];
    imdbId?: string;
    tvdbId?: number;
    tmdbId?: number;
    summary?: string;
    genres?: string[];
    network?: string;
    contentRating?: string;
}
export interface PlexEpisode {
    ratingKey: string;
    title: string;
    seasonNumber: number;
    episodeNumber: number;
    duration?: number;
    viewCount?: number;
    lastViewedAt?: number;
    guid?: string;
    Guid?: {
        id: string;
    }[];
    imdbId?: string;
    tvdbId?: number;
    tmdbId?: number;
    show?: PlexShow;
}
export interface PlexWatchSession {
    ratingKey: string;
    title: string;
    type: 'movie' | 'episode';
    viewOffset?: number;
    duration?: number;
    progress?: number;
    sessionKey?: string;
    userId?: number;
    userName?: string;
    state?: 'playing' | 'paused' | 'stopped';
    seasonNumber?: number;
    episodeNumber?: number;
    show?: PlexShow;
    movie?: PlexMovie;
}
export declare class PlexToTraktMapper {
    /**
     * Extract IMDb, TMDB, and TVDB ids from a legacy agent guid or imdb://, tmdb://, tvdb://.
     */
    private extractIdsFromGuid;
    /**
     * Extract IDs from multiple Plex fields
     */
    private extractAllIds;
    /**
     * Convert Plex movie to Trakt format
     */
    mapPlexMovieToTrakt(plexMovie: PlexMovie): TraktMovie;
    /**
     * Convert Plex show to Trakt format
     */
    mapPlexShowToTrakt(plexShow: PlexShow): TraktShow;
    /**
     * Convert Plex episode to Trakt format
     */
    mapPlexEpisodeToTrakt(plexEpisode: PlexEpisode): {
        show: TraktShow;
        episode: TraktEpisode;
    };
    /**
     * Convert Plex watch session to Trakt scrobble format
     */
    mapPlexWatchSessionToScrobble(session: PlexWatchSession): TraktScrobbleItem;
    /**
     * Convert Plex movies to Trakt sync format
     */
    mapPlexMoviesForSync(plexMovies: PlexMovie[]): TraktSyncRequest['movies'];
    /**
     * Convert Plex episodes to Trakt sync format
     */
    mapPlexEpisodesForSync(plexEpisodes: PlexEpisode[]): TraktSyncRequest['shows'];
    /**
     * Validate that a Plex item has enough data for Trakt sync
     */
    validatePlexItemForSync(item: PlexMovie | PlexShow | PlexEpisode): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Clean and prepare Trakt IDs object
     */
    cleanTraktIds(ids: Partial<TraktIds>): Partial<TraktIds>;
}
