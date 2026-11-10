/**
 * Sonarr/Radarr API Clients
 * Base class with shared auth/error handling, subclasses for service-specific endpoints.
 */
import { AxiosInstance } from "axios";
import { ArrConfig, ArrSystemStatus, ArrQualityProfile, ArrRootFolder, ArrTag, ArrQueueResponse, SonarrSeries, SonarrSearchResult, SonarrCalendarEntry, SonarrMissingResponse, SonarrAddSeriesRequest, RadarrMovie, RadarrSearchResult, RadarrCalendarEntry, RadarrMissingResponse, RadarrAddMovieRequest } from "./types.js";
declare class ArrClient {
    protected config: ArrConfig;
    protected serviceName: string;
    protected http: AxiosInstance;
    constructor(config: ArrConfig, serviceName: string);
    getSystemStatus(): Promise<ArrSystemStatus>;
    getQualityProfiles(): Promise<ArrQualityProfile[]>;
    getRootFolders(): Promise<ArrRootFolder[]>;
    getTags(): Promise<ArrTag[]>;
    createTag(label: string): Promise<ArrTag>;
    updateTag(id: number, label: string): Promise<ArrTag>;
    deleteTag(id: number): Promise<void>;
    getQueue(page?: number, pageSize?: number): Promise<ArrQueueResponse>;
    testConnection(): Promise<{
        success: boolean;
        status?: ArrSystemStatus;
        error?: string;
    }>;
}
export declare class SonarrClient extends ArrClient {
    constructor(config: ArrConfig);
    getSeries(): Promise<SonarrSeries[]>;
    getSeriesById(id: number): Promise<SonarrSeries>;
    searchSeries(query: string): Promise<SonarrSearchResult[]>;
    addSeries(request: SonarrAddSeriesRequest): Promise<SonarrSeries>;
    getMissing(page?: number, pageSize?: number): Promise<SonarrMissingResponse>;
    getCalendar(startDate?: string, endDate?: string): Promise<SonarrCalendarEntry[]>;
    triggerSeriesSearch(seriesId: number): Promise<{
        id: number;
    }>;
    triggerMissingSearch(): Promise<{
        id: number;
    }>;
}
export declare class RadarrClient extends ArrClient {
    constructor(config: ArrConfig);
    getMovies(): Promise<RadarrMovie[]>;
    getMovieById(id: number): Promise<RadarrMovie>;
    searchMovies(query: string): Promise<RadarrSearchResult[]>;
    addMovie(request: RadarrAddMovieRequest): Promise<RadarrMovie>;
    getMissing(page?: number, pageSize?: number): Promise<RadarrMissingResponse>;
    getCalendar(startDate?: string, endDate?: string): Promise<RadarrCalendarEntry[]>;
    triggerMovieSearch(movieId: number): Promise<{
        id: number;
    }>;
    triggerMissingSearch(): Promise<{
        id: number;
    }>;
}
export {};
