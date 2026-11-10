/**
 * Arr MCP Functions
 * MCP tool implementations for Sonarr and Radarr integration.
 * Follows lazy initialization pattern from trakt/mcp-functions.ts.
 */
export declare class ArrMCPFunctions {
    private sonarrClient;
    private radarrClient;
    private sonarrInitialized;
    private radarrInitialized;
    private ensureSonarr;
    private ensureRadarr;
    sonarrGetTags(): Promise<Record<string, unknown>>;
    sonarrCreateTag(args: {
        label: string;
    }): Promise<Record<string, unknown>>;
    sonarrUpdateTag(args: {
        id: number;
        label: string;
    }): Promise<Record<string, unknown>>;
    sonarrDeleteTag(args: {
        id: number;
    }): Promise<Record<string, unknown>>;
    sonarrGetSeries(args: {
        filter?: string;
        limit?: number;
    }): Promise<Record<string, unknown>>;
    sonarrSearch(args: {
        query: string;
        limit?: number;
    }): Promise<Record<string, unknown>>;
    sonarrAddSeries(args: {
        tvdbId: number;
        title: string;
        qualityProfileId?: number;
        rootFolderPath?: string;
        monitored?: boolean;
        seasonFolder?: boolean;
        monitorType?: string;
        seriesType?: string;
        searchForMissingEpisodes?: boolean;
        searchForCutoffUnmetEpisodes?: boolean;
        tags?: string[];
    }): Promise<Record<string, unknown>>;
    sonarrGetMissing(args: {
        page?: number;
        pageSize?: number;
    }): Promise<Record<string, unknown>>;
    sonarrGetQueue(args?: {
        limit?: number;
    }): Promise<Record<string, unknown>>;
    sonarrGetCalendar(args: {
        startDate?: string;
        endDate?: string;
        limit?: number;
    }): Promise<Record<string, unknown>>;
    sonarrGetProfiles(): Promise<Record<string, unknown>>;
    sonarrTriggerSearch(args: {
        seriesId?: number;
    }): Promise<Record<string, unknown>>;
    radarrGetTags(): Promise<Record<string, unknown>>;
    radarrCreateTag(args: {
        label: string;
    }): Promise<Record<string, unknown>>;
    radarrUpdateTag(args: {
        id: number;
        label: string;
    }): Promise<Record<string, unknown>>;
    radarrDeleteTag(args: {
        id: number;
    }): Promise<Record<string, unknown>>;
    radarrGetMovies(args: {
        filter?: string;
        limit?: number;
    }): Promise<Record<string, unknown>>;
    radarrSearch(args: {
        query: string;
        limit?: number;
    }): Promise<Record<string, unknown>>;
    radarrAddMovie(args: {
        tmdbId: number;
        title: string;
        qualityProfileId?: number;
        rootFolderPath?: string;
        monitored?: boolean;
        minimumAvailability?: string;
        monitorType?: string;
        searchForMovie?: boolean;
        tags?: string[];
    }): Promise<Record<string, unknown>>;
    radarrGetMissing(args: {
        page?: number;
        pageSize?: number;
    }): Promise<Record<string, unknown>>;
    radarrGetQueue(args?: {
        limit?: number;
    }): Promise<Record<string, unknown>>;
    radarrGetCalendar(args: {
        startDate?: string;
        endDate?: string;
        limit?: number;
    }): Promise<Record<string, unknown>>;
    radarrGetProfiles(): Promise<Record<string, unknown>>;
    radarrTriggerSearch(args: {
        movieId?: number;
    }): Promise<Record<string, unknown>>;
    arrGetStatus(): Promise<Record<string, unknown>>;
}
