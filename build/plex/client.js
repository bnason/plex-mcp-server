/**
 * Plex API Client
 * Shared HTTP client for communicating with Plex Media Server.
 * Implements PlexAPIClient interface for Trakt sync compatibility.
 */
import axios from "axios";
import { PLEX_TYPE_IDS, PLEX_CONTAINER_SIZE, PLEX_MAX_PAGES } from "./constants.js";
import { validatePlexId } from "../shared/utils.js";
const PLEX_DISCOVER_BASE_URL = "https://discover.provider.plex.tv";
export class PlexClient {
    config;
    constructor(config) {
        this.config = config;
        // Strip trailing slashes to prevent double-slash in URLs
        this.config = {
            ...config,
            baseUrl: config.baseUrl.replace(/\/+$/, ""),
            clientIdentifier: config.clientIdentifier || "plex-mcp-server",
        };
    }
    async makeRequest(endpoint, params = {}, method = "GET") {
        const url = `${this.config.baseUrl}${endpoint}`;
        const axiosConfig = {
            method,
            headers: {
                "X-Plex-Token": this.config.token,
                Accept: "application/json",
            },
            params,
        };
        const response = await axios(url, axiosConfig);
        return response.data;
    }
    async makeDiscoverRequest(endpoint, params = {}, method = "GET") {
        const response = await axios(`${PLEX_DISCOVER_BASE_URL}${endpoint}`, {
            method,
            headers: {
                "X-Plex-Token": this.config.token,
                "X-Plex-Client-Identifier": this.config.clientIdentifier,
                "X-Plex-Product": "plex-mcp-server",
                Accept: "application/json",
            },
            params,
        });
        return response.data;
    }
    getPlexTypeId(type) {
        if (!Object.hasOwn(PLEX_TYPE_IDS, type)) {
            throw new Error(`Unknown media type "${type}". Expected one of: ${Object.keys(PLEX_TYPE_IDS).join(", ")}`);
        }
        return PLEX_TYPE_IDS[type];
    }
    // PlexAPIClient implementation for Trakt sync
    async getWatchedMovies(userId) {
        const movies = await this.fetchAllPages("/library/all", { type: 1, includeGuids: 1 });
        return movies
            .filter((item) => item.viewCount > 0)
            .map((item) => ({
            ratingKey: item.ratingKey,
            title: item.title,
            year: item.year,
            guid: item.guid,
            Guid: this.externalGuids(item.Guid),
            duration: item.duration,
            viewCount: item.viewCount,
            lastViewedAt: item.lastViewedAt,
            addedAt: item.addedAt,
            updatedAt: item.updatedAt,
            genres: item.Genre?.map((g) => g.tag) || [],
            summary: item.summary,
        }));
    }
    async getLibraryMoviesWithMeta(libraryKey, userId) {
        const allMovies = [];
        let offset = 0;
        const pageSize = PLEX_CONTAINER_SIZE;
        while (true) {
            const params = {
                type: 1,
                "X-Plex-Container-Start": offset,
                "X-Plex-Container-Size": pageSize,
            };
            if (userId)
                params.accountID = userId;
            const data = await this.makeRequest(`/library/sections/${libraryKey}/all`, params);
            const container = data;
            const totalSize = container.MediaContainer?.totalSize || 0;
            const items = container.MediaContainer?.Metadata || [];
            for (const item of items) {
                allMovies.push({
                    ratingKey: item.ratingKey,
                    title: item.title,
                    year: item.year,
                    viewCount: item.viewCount || 0,
                    lastViewedAt: item.lastViewedAt,
                    rating: item.audienceRating ?? item.rating,
                    genres: item.Genre?.map((g) => g.tag) || [],
                    directors: item.Director?.map((d) => d.tag) || [],
                    actors: item.Role?.map((r) => r.tag) || [],
                });
            }
            offset += items.length;
            if (offset >= totalSize || items.length === 0)
                break;
        }
        return allMovies;
    }
    async getWatchedEpisodes(userId) {
        const episodes = [];
        const librariesData = await this.makeRequest("/library/sections");
        const libContainer = librariesData;
        const libraries = libContainer.MediaContainer?.Directory || [];
        const showLibraries = libraries.filter((lib) => lib.type === "show");
        for (const library of showLibraries) {
            const libraryKey = String(library.key);
            const showsByRatingKey = await this.getShowsByRatingKey(libraryKey);
            const libraryEpisodes = await this.fetchAllPages(`/library/sections/${libraryKey}/all`, {
                type: 4,
                includeGuids: 1,
            });
            episodes.push(...libraryEpisodes
                .filter((item) => item.viewCount > 0)
                .map((item) => this.toWatchedEpisode(item, showsByRatingKey)));
        }
        return episodes;
    }
    async getCurrentSessions() {
        const data = await this.makeRequest("/status/sessions");
        const container = data;
        const sessions = container.MediaContainer?.Metadata || [];
        return sessions.map((session) => ({
            ratingKey: session.ratingKey,
            title: session.title,
            type: (session.type === "movie" ? "movie" : "episode"),
            viewOffset: session.viewOffset,
            duration: session.duration,
            progress: session.viewOffset && session.duration
                ? Math.round((session.viewOffset / session.duration) * 100)
                : 0,
            sessionKey: session.sessionKey,
            userId: session.User?.id,
            userName: session.User?.title,
            state: "playing",
            seasonNumber: session.parentIndex,
            episodeNumber: session.index,
        }));
    }
    async markAsWatched(ratingKey, userId) {
        validatePlexId(ratingKey, "ratingKey");
        await this.makeRequest("/:/scrobble", {
            key: ratingKey,
            identifier: "com.plexapp.plugins.library",
        });
    }
    async rateMedia(ratingKey, rating) {
        validatePlexId(ratingKey, "ratingKey");
        await this.makeRequest("/:/rate", {
            key: ratingKey,
            identifier: "com.plexapp.plugins.library",
            rating,
        }, "PUT");
    }
    async markAsUnwatched(ratingKey) {
        validatePlexId(ratingKey, "ratingKey");
        await this.makeRequest("/:/unscrobble", {
            key: ratingKey,
            identifier: "com.plexapp.plugins.library",
        });
    }
    async updateProgress(ratingKey, progress, userId) {
        validatePlexId(ratingKey, "ratingKey");
        await this.makeRequest("/:/progress", {
            key: ratingKey,
            time: progress,
            identifier: "com.plexapp.plugins.library",
        });
    }
    /**
     * Fetch every item of a listing, one PLEX_CONTAINER_SIZE page at a time.
     * Some endpoints omit totalSize, so a missing total means "unknown" and only
     * a short or empty page ends the walk.
     */
    async fetchAllPages(endpoint, params) {
        const all = [];
        for (let page = 0; page < PLEX_MAX_PAGES; page++) {
            const data = await this.makeRequest(endpoint, {
                ...params,
                "X-Plex-Container-Start": all.length,
                "X-Plex-Container-Size": PLEX_CONTAINER_SIZE,
            });
            const container = data;
            const items = container.MediaContainer?.Metadata || [];
            const totalSize = container.MediaContainer?.totalSize;
            all.push(...items);
            if (items.length < PLEX_CONTAINER_SIZE)
                return all;
            if (typeof totalSize === "number" && all.length >= totalSize)
                return all;
        }
        throw new Error(`Plex listing ${endpoint} did not finish within ${PLEX_MAX_PAGES} pages of ${PLEX_CONTAINER_SIZE} items`);
    }
    async getShowsByRatingKey(libraryKey) {
        const items = await this.fetchAllPages(`/library/sections/${libraryKey}/all`, {
            type: 2,
            includeGuids: 1,
        });
        const shows = new Map();
        for (const item of items) {
            if (item.ratingKey === undefined || item.ratingKey === null)
                continue;
            const ratingKey = String(item.ratingKey);
            shows.set(ratingKey, {
                ratingKey,
                title: item.title || "",
                year: item.year,
                guid: item.guid,
                Guid: this.externalGuids(item.Guid),
            });
        }
        return shows;
    }
    toWatchedEpisode(item, showsByRatingKey) {
        const grandparentKey = this.ratingKeyString(item.grandparentRatingKey);
        const matched = grandparentKey ? showsByRatingKey.get(grandparentKey) : undefined;
        return {
            ratingKey: item.ratingKey,
            title: item.title,
            seasonNumber: item.parentIndex || 1,
            episodeNumber: item.index || 1,
            duration: item.duration,
            viewCount: item.viewCount,
            lastViewedAt: item.lastViewedAt,
            guid: item.guid,
            Guid: this.externalGuids(item.Guid),
            show: {
                ratingKey: matched?.ratingKey ?? grandparentKey ?? "",
                title: matched?.title || item.grandparentTitle,
                year: matched?.year ?? item.grandparentYear,
                guid: matched?.guid ?? item.grandparentGuid,
                Guid: matched?.Guid,
            },
        };
    }
    ratingKeyString(value) {
        if (value === undefined || value === null || value === "")
            return undefined;
        return String(value);
    }
    externalGuids(value) {
        if (!Array.isArray(value))
            return undefined;
        const guids = [];
        for (const entry of value) {
            if (!entry || typeof entry !== "object" || !("id" in entry))
                continue;
            const id = entry.id;
            if (typeof id !== "string" || id.length === 0)
                continue;
            guids.push({ id });
        }
        return guids;
    }
}
