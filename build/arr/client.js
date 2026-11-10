/**
 * Sonarr/Radarr API Clients
 * Base class with shared auth/error handling, subclasses for service-specific endpoints.
 */
import axios from "axios";
import { ARR_API_TIMEOUT, ARR_LARGE_REQUEST_TIMEOUT, ARR_DEFAULT_PAGE_SIZE, ARR_CALENDAR_DAYS_PAST, ARR_CALENDAR_DAYS_FUTURE, } from "./constants.js";
/**
 * Sonarr v4 / Radarr v5 may wrap list endpoints in { records: [...] } or similar.
 * This extracts the array regardless of shape.
 */
function ensureArray(data) {
    if (Array.isArray(data))
        return data;
    if (data && typeof data === "object") {
        const obj = data;
        // Try common wrapper keys: records, items, data
        for (const key of ["records", "items", "data"]) {
            if (Array.isArray(obj[key]))
                return obj[key];
        }
        // Last resort: find the first array property
        for (const value of Object.values(obj)) {
            if (Array.isArray(value))
                return value;
        }
    }
    throw new Error(`Expected array from API but got ${typeof data}`);
}
class ArrClient {
    config;
    serviceName;
    http;
    constructor(config, serviceName) {
        this.config = config;
        this.serviceName = serviceName;
        const baseUrl = config.baseUrl.replace(/\/+$/, "");
        this.http = axios.create({
            baseURL: `${baseUrl}/api/v3`,
            timeout: ARR_API_TIMEOUT,
            headers: { "X-Api-Key": config.apiKey },
        });
        this.http.interceptors.response.use(undefined, (error) => {
            if (error.response?.status === 401) {
                throw new Error(`${this.serviceName}: Invalid API key`);
            }
            if (error.code === "ECONNREFUSED") {
                throw new Error(`${this.serviceName}: Connection refused at ${config.baseUrl} — is the service running?`);
            }
            if (error.response?.status === 404) {
                throw new Error(`${this.serviceName}: Endpoint not found — check URL and API version`);
            }
            // Strip sensitive data from axios error before re-throwing
            if (error.response?.data) {
                const message = typeof error.response.data === 'string'
                    ? error.response.data
                    : error.response.data?.message || JSON.stringify(error.response.data);
                throw new Error(`${this.serviceName}: ${error.response.status} ${message}`);
            }
            if (error.message) {
                throw new Error(`${this.serviceName}: ${error.message}`);
            }
            throw error;
        });
    }
    async getSystemStatus() {
        const { data } = await this.http.get("/system/status");
        return data;
    }
    async getQualityProfiles() {
        const { data } = await this.http.get("/qualityprofile");
        return data;
    }
    async getRootFolders() {
        const { data } = await this.http.get("/rootfolder");
        return data;
    }
    async getTags() {
        const { data } = await this.http.get("/tag");
        return data;
    }
    async createTag(label) {
        const { data } = await this.http.post("/tag", { label });
        return data;
    }
    async updateTag(id, label) {
        const { data } = await this.http.put(`/tag/${id}`, { id, label });
        return data;
    }
    async deleteTag(id) {
        await this.http.delete(`/tag/${id}`);
    }
    async getQueue(page = 1, pageSize = ARR_DEFAULT_PAGE_SIZE) {
        const { data } = await this.http.get("/queue", {
            params: { page, pageSize, includeUnknownSeriesItems: true },
        });
        return data;
    }
    async testConnection() {
        try {
            const status = await this.getSystemStatus();
            return { success: true, status };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
}
export class SonarrClient extends ArrClient {
    constructor(config) {
        super(config, "Sonarr");
    }
    async getSeries() {
        const { data } = await this.http.get("/series", {
            timeout: ARR_LARGE_REQUEST_TIMEOUT,
        });
        return ensureArray(data);
    }
    async getSeriesById(id) {
        const { data } = await this.http.get(`/series/${id}`);
        return data;
    }
    async searchSeries(query) {
        const { data } = await this.http.get("/series/lookup", {
            params: { term: query },
        });
        return ensureArray(data);
    }
    async addSeries(request) {
        const { data } = await this.http.post("/series", request);
        return data;
    }
    async getMissing(page = 1, pageSize = ARR_DEFAULT_PAGE_SIZE) {
        const { data } = await this.http.get("/wanted/missing", {
            params: { page, pageSize, sortKey: "airDateUtc", sortDirection: "descending" },
        });
        return data;
    }
    async getCalendar(startDate, endDate) {
        const start = startDate || new Date(Date.now() - ARR_CALENDAR_DAYS_PAST * 86400000).toISOString().split("T")[0];
        const end = endDate || new Date(Date.now() + ARR_CALENDAR_DAYS_FUTURE * 86400000).toISOString().split("T")[0];
        const { data } = await this.http.get("/calendar", {
            params: { start, end, unmonitored: false, includeSeries: true },
        });
        return ensureArray(data);
    }
    async triggerSeriesSearch(seriesId) {
        const { data } = await this.http.post("/command", {
            name: "SeriesSearch",
            seriesId,
        });
        return data;
    }
    async triggerMissingSearch() {
        const { data } = await this.http.post("/command", {
            name: "MissingEpisodeSearch",
        });
        return data;
    }
}
export class RadarrClient extends ArrClient {
    constructor(config) {
        super(config, "Radarr");
    }
    async getMovies() {
        const { data } = await this.http.get("/movie", {
            timeout: ARR_LARGE_REQUEST_TIMEOUT,
        });
        return ensureArray(data);
    }
    async getMovieById(id) {
        const { data } = await this.http.get(`/movie/${id}`);
        return data;
    }
    async searchMovies(query) {
        const { data } = await this.http.get("/movie/lookup", {
            params: { term: query },
        });
        return ensureArray(data);
    }
    async addMovie(request) {
        const { data } = await this.http.post("/movie", request);
        return data;
    }
    async getMissing(page = 1, pageSize = ARR_DEFAULT_PAGE_SIZE) {
        const { data } = await this.http.get("/wanted/missing", {
            params: { page, pageSize, sortKey: "digitalRelease", sortDirection: "descending" },
        });
        return data;
    }
    async getCalendar(startDate, endDate) {
        const start = startDate || new Date(Date.now() - ARR_CALENDAR_DAYS_PAST * 86400000).toISOString().split("T")[0];
        const end = endDate || new Date(Date.now() + ARR_CALENDAR_DAYS_FUTURE * 86400000).toISOString().split("T")[0];
        const { data } = await this.http.get("/calendar", {
            params: { start, end, unmonitored: false },
        });
        return ensureArray(data);
    }
    async triggerMovieSearch(movieId) {
        const { data } = await this.http.post("/command", {
            name: "MoviesSearch",
            movieIds: [movieId],
        });
        return data;
    }
    async triggerMissingSearch() {
        const { data } = await this.http.post("/command", {
            name: "MissingMoviesSearch",
        });
        return data;
    }
}
