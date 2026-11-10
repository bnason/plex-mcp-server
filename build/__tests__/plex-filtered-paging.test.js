import { describe, it, expect, vi, beforeEach } from "vitest";
import { PlexTools } from "../plex/tools.js";
import { PlexClient } from "../plex/client.js";
import { PLEX_FILTERED_SCAN_MAX_PAGES } from "../plex/constants.js";
const HISTORY = "/status/sessions/history/all";
const episode = (n) => ({ historyKey: `h${n}`, ratingKey: `e${n}`, title: `Episode ${n}`, type: "episode", viewedAt: 10_000 - n });
const movie = (n) => ({ historyKey: `h${n}`, ratingKey: `m${n}`, title: `Movie ${n}`, type: "movie", viewedAt: 10_000 - n });
const show = (n, viewedLeafCount) => ({ ratingKey: `s${n}`, title: `Show ${n}`, type: "show", viewCount: 1, leafCount: 10, viewedLeafCount });
/** A Plex that honours X-Plex-Container-Start/Size over a fixed list of rows. */
function pagedServer(rows, extra = {}) {
    return async (_path, params = {}) => {
        const start = Number(params["X-Plex-Container-Start"] ?? 0);
        const size = Number(params["X-Plex-Container-Size"] ?? rows.length);
        return { MediaContainer: { Metadata: rows.slice(start, start + size), ...extra } };
    };
}
function setup() {
    const makeRequest = vi.fn();
    const client = {
        makeRequest,
        getPlexTypeId: (type) => PlexClient.prototype.getPlexTypeId.call(null, type),
    };
    return { makeRequest, tools: new PlexTools(client) };
}
const parse = (response) => JSON.parse(response.content[0].text);
const starts = (makeRequest) => makeRequest.mock.calls.map((call) => call[1]["X-Plex-Container-Start"]);
describe("watch history filtered by type", () => {
    let makeRequest;
    let tools;
    beforeEach(() => {
        ({ makeRequest, tools } = setup());
    });
    it("pages past episodes to find movies", async () => {
        makeRequest.mockImplementation(pagedServer([...Array.from({ length: 100 }, (_, i) => episode(i)), movie(100), movie(101), movie(102)]));
        const result = parse(await tools.getRecentlyWatched(10, "movie"));
        expect(result.recentlyWatched.map((row) => row.ratingKey)).toEqual(["m100", "m101", "m102"]);
        expect(starts(makeRequest)).toEqual([0, 100]);
        expect(makeRequest.mock.calls.every((call) => call[0] === HISTORY)).toBe(true);
    });
    it("treats show as its episodes, which is how TV appears in history", async () => {
        makeRequest.mockImplementation(pagedServer([episode(1), movie(2), episode(3)]));
        const result = parse(await tools.getWatchHistory(5, undefined, "show"));
        expect(result.watchHistory.map((row) => row.ratingKey)).toEqual(["e1", "e3"]);
    });
    it("stops after one full page that already has enough matches, and returns only the limit", async () => {
        makeRequest.mockImplementation(pagedServer(Array.from({ length: 150 }, (_, i) => movie(i))));
        const result = parse(await tools.getRecentlyWatched(2, "movie"));
        expect(result.recentlyWatched).toHaveLength(2);
        expect(starts(makeRequest)).toEqual([0]);
    });
    it("stops when Plex reports it has sent every row", async () => {
        makeRequest.mockImplementation(pagedServer(Array.from({ length: 100 }, (_, i) => episode(i)), { totalSize: 100 }));
        const result = parse(await tools.getRecentlyWatched(10, "movie"));
        expect(result.recentlyWatched).toEqual([]);
        expect(starts(makeRequest)).toEqual([0]);
    });
    it("stops, without duplicates, if Plex ignores the start offset", async () => {
        const page = [movie(1), ...Array.from({ length: 99 }, (_, i) => episode(i + 2))];
        makeRequest.mockResolvedValue({ MediaContainer: { Metadata: page } });
        const result = parse(await tools.getRecentlyWatched(10, "movie"));
        expect(result.recentlyWatched.map((row) => row.ratingKey)).toEqual(["m1"]);
        expect(makeRequest).toHaveBeenCalledTimes(2);
        // Only one page was really seen, so the result may be incomplete.
        expect(result.scanCapped).toBe(true);
    });
    it("gives up after the page cap and says so", async () => {
        let n = 0;
        makeRequest.mockImplementation(async (_path, params) => ({
            MediaContainer: { Metadata: Array.from({ length: Number(params["X-Plex-Container-Size"]) }, () => episode(n++)) },
        }));
        const result = parse(await tools.getRecentlyWatched(10, "movie"));
        expect(result.recentlyWatched).toEqual([]);
        expect(result.scanCapped).toBe(true);
        expect(starts(makeRequest)).toEqual(Array.from({ length: PLEX_FILTERED_SCAN_MAX_PAGES }, (_, i) => i * 100));
    });
    it("makes exactly one request of the limit when not filtering", async () => {
        makeRequest.mockImplementation(pagedServer(Array.from({ length: 300 }, (_, i) => episode(i))));
        const result = parse(await tools.getWatchHistory(25));
        expect(result.watchHistory).toHaveLength(25);
        expect(makeRequest).toHaveBeenCalledTimes(1);
        expect(makeRequest.mock.calls[0][1]).toMatchObject({ "X-Plex-Container-Start": 0, "X-Plex-Container-Size": 25 });
        expect(result.scanCapped).toBeUndefined();
    });
});
describe("fully watched shows", () => {
    let makeRequest;
    let tools;
    beforeEach(() => {
        ({ makeRequest, tools } = setup());
    });
    it("pages past partly watched shows to fill the limit", async () => {
        makeRequest.mockImplementation(pagedServer([show(1, 4), show(2, 4), show(3, 4), show(4, 4), show(5, 10), show(6, 10)]));
        const result = parse(await tools.getFullyWatched("2", "show", 2));
        expect(result.fullyWatched.map((row) => row.ratingKey)).toEqual(["s5", "s6"]);
        expect(starts(makeRequest)).toEqual([0, 4]);
    });
    it("stops after one full page that already fills the limit", async () => {
        makeRequest.mockImplementation(pagedServer([show(1, 10), show(2, 10), show(3, 4), show(4, 4), show(5, 10)]));
        const result = parse(await tools.getFullyWatched("2", "show", 2));
        expect(result.fullyWatched.map((row) => row.ratingKey)).toEqual(["s1", "s2"]);
        expect(starts(makeRequest)).toEqual([0]);
    });
    it("asks for at least one row when given a negative limit", async () => {
        makeRequest.mockImplementation(pagedServer([show(1, 10), show(2, 10)]));
        const result = parse(await tools.getFullyWatched("2", "show", -3));
        expect(result.fullyWatched).toHaveLength(1);
        expect(makeRequest.mock.calls[0][1]).toMatchObject({ "X-Plex-Container-Size": 2 });
    });
});
