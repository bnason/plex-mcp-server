import { describe, it, expect, vi, beforeEach } from "vitest";
import { PlexTools } from "../plex/tools.js";
import { PlexClient } from "../plex/client.js";
import { xmlElements } from "../plex/users.js";
import { createPlexToolRegistry } from "../plex/tool-registry.js";
const USERS_XML = `<?xml version="1.0" encoding="UTF-8"?>
<MediaContainer friendlyName="myPlex" identifier="com.plexapp.plugins.myplex" machineIdentifier="x" totalSize="3" size="3">
  <User id="1001" title="Rhett" username="" email="" recommendationsPlaylistId="" thumb="" home="1" restricted="1">
    <Server id="9" serverId="9" machineIdentifier="machine-abc" name="Home" lastSeenAt="0" numLibraries="3" allLibraries="0" owned="1" pending="0"/>
  </User>
  <User id="1002" title="Rory" username="" home="1" restricted="1"></User>
  <User id="1003" title="Pat &amp; Sam" username="patsam" home="0" restricted="0"></User>
</MediaContainer>`;
const SHARED_XML = `<?xml version="1.0" encoding="UTF-8"?>
<MediaContainer friendlyName="myPlex" identifier="com.plexapp.plugins.myplex" machineIdentifier="machine-abc" size="2">
  <SharedServer id="1" username="" email="" userID="1001" accessToken="token-rhett" name="Home" acceptedAt="1" invitedAt="1" allowSync="0" owned="0"/>
  <SharedServer id="2" username="" email="" userID="1002" accessToken="token-rory" name="Home" acceptedAt="1" invitedAt="1" allowSync="0" owned="0"/>
</MediaContainer>`;
/** A client answering the identity, account and label lookups, plus whatever `metadata` returns. */
function createClient(metadata) {
    const makeRequest = vi.fn(async (endpoint, params = {}, _method = "GET", token) => {
        if (endpoint === "/identity")
            return { MediaContainer: { machineIdentifier: "machine-abc" } };
        if (endpoint === "/accounts")
            return { MediaContainer: { Account: [{ id: 1, name: "Owner" }, { id: 1001, name: "Rhett" }] } };
        if (endpoint.endsWith("/label")) {
            return { MediaContainer: { Directory: [{ key: "501", title: "Rhett" }, { fastKey: "/library/sections/1/all?label=502", key: "/x", title: "Rory" }] } };
        }
        return metadata(endpoint, params, token);
    });
    const makePlexTvRequest = vi.fn(async (endpoint) => {
        if (endpoint === "/api/users")
            return USERS_XML;
        if (endpoint === "/api/servers/machine-abc/shared_servers")
            return SHARED_XML;
        throw new Error(`unexpected ${endpoint}`);
    });
    const client = {
        makeRequest,
        makePlexTvRequest,
        makeDiscoverRequest: vi.fn(),
        getPlexTypeId: vi.fn((type) => PlexClient.prototype.getPlexTypeId.call(null, type)),
    };
    return { client, makeRequest, makePlexTvRequest };
}
const parse = (response) => JSON.parse(response.content[0].text);
const listing = (items) => ({ MediaContainer: { totalSize: items.length, Metadata: items } });
describe("xmlElements", () => {
    it("reads attributes and decodes entities", () => {
        const users = xmlElements(USERS_XML, "User");
        expect(users.map((user) => user.title)).toEqual(["Rhett", "Rory", "Pat & Sam"]);
        expect(xmlElements(USERS_XML, "Server")).toHaveLength(1);
    });
});
describe("per-user views", () => {
    let fixture;
    let tools;
    beforeEach(() => {
        fixture = createClient((endpoint, _params, token) => listing(token === "token-rhett" ? [{ ratingKey: "1", title: "Kid Film", type: "movie" }] : [
            { ratingKey: "1", title: "Kid Film", type: "movie" },
            { ratingKey: "2", title: "Grown-up Film", type: "movie" },
        ]));
        tools = new PlexTools(fixture.client);
    });
    it("lists a library with the user's own server token", async () => {
        const result = parse(await tools.getLibraryItems("1", "movie", 50, 0, undefined, "rhett"));
        expect(result.user).toBe("rhett");
        expect(result.totalSize).toBe(1);
        const call = fixture.makeRequest.mock.calls.find(([endpoint]) => endpoint === "/library/sections/1/all");
        expect(call?.[3]).toBe("token-rhett");
        expect(JSON.stringify(result)).not.toContain("token-rhett");
    });
    it("uses the configured token when no user, or the owner, is named", async () => {
        expect(parse(await tools.getLibraryItems("1")).totalSize).toBe(2);
        expect(parse(await tools.getLibraryItems("1", undefined, 50, 0, undefined, "owner")).totalSize).toBe(2);
        expect(fixture.makePlexTvRequest).not.toHaveBeenCalled();
    });
    it("matches a plex.tv user id and reuses the token", async () => {
        await tools.searchMedia("film", undefined, undefined, 10, 0, "1002");
        await tools.searchMedia("film", undefined, undefined, 10, 0, "Rory");
        const searches = fixture.makeRequest.mock.calls.filter(([endpoint]) => endpoint === "/search");
        expect(searches.map((call) => call[3])).toEqual(["token-rory", "token-rory"]);
        expect(fixture.makePlexTvRequest.mock.calls.filter(([endpoint]) => endpoint.includes("shared_servers"))).toHaveLength(1);
    });
    it("names the known users when a name does not match, without tokens", async () => {
        const error = await tools.getLibraryItems("1", undefined, 50, 0, undefined, "Nobody").catch((e) => e);
        expect(String(error)).toContain("Rhett, Rory, Pat & Sam");
        expect(String(error)).not.toContain("token-");
    });
    it("refuses a user the server is not shared with", async () => {
        const error = await tools.getMediaDetails("1", "patsam").catch((e) => e);
        expect(String(error)).toContain("did not provide access");
    });
    it("reports an item the user cannot see as not visible", async () => {
        fixture = createClient((_endpoint, _params, token) => {
            if (token)
                throw Object.assign(new Error("Request failed with status code 401"), { response: { status: 401 } });
            return listing([{ ratingKey: "2", title: "Grown-up Film", type: "movie" }]);
        });
        tools = new PlexTools(fixture.client);
        expect(parse(await tools.getMediaDetails("2", "Rhett"))).toEqual({ ratingKey: "2", user: "Rhett", visible: false });
        expect(parse(await tools.getMediaDetails("2")).details.title).toBe("Grown-up Film");
    });
    it("filters by a label name, by key or fastKey", async () => {
        await tools.getLibraryItems("1", "movie", 50, 0, undefined, undefined, "rhett");
        await tools.getLibraryItems("1", undefined, 50, 0, undefined, undefined, "Rory");
        const lists = fixture.makeRequest.mock.calls.filter(([endpoint]) => endpoint === "/library/sections/1/all");
        expect(lists.map((call) => call[1].label)).toEqual(["501", "502"]);
        const labelLookup = fixture.makeRequest.mock.calls.find(([endpoint]) => endpoint === "/library/sections/1/label");
        expect(labelLookup?.[1]).toEqual({ type: 1 });
    });
    it("lists the library's labels when a label is unknown", async () => {
        const error = await tools.getLibraryItems("1", undefined, 50, 0, undefined, undefined, "Kids").catch((e) => e);
        expect(String(error)).toContain("Labels: Rhett, Rory");
    });
    it("reports the reading account's watch status for each item", async () => {
        fixture = createClient((_endpoint, _params, token) => listing(token === "token-rhett" ? [
            { ratingKey: "1", title: "Seen", type: "movie", viewCount: 2, lastViewedAt: 1700000000 },
            { ratingKey: "2", title: "Half", type: "movie", viewOffset: 3000, duration: 6000 },
            { ratingKey: "3", title: "Fresh", type: "movie" },
            { ratingKey: "4", title: "Show", type: "show", leafCount: 10, viewedLeafCount: 4, lastViewedAt: 1700000001 },
            { ratingKey: "5", title: "Done Show", type: "show", leafCount: 3, viewedLeafCount: 3 },
        ] : [{ ratingKey: "1", title: "Seen", type: "movie" }]));
        tools = new PlexTools(fixture.client);
        const items = parse(await tools.getLibraryItems("1", undefined, 50, 0, undefined, "Rhett")).items;
        expect(items.map((item) => item.watchStatus)).toEqual(["watched", "partial", "unwatched", "partial", "watched"]);
        expect(items[0]).toMatchObject({ viewCount: 2, lastViewedAt: 1700000000 });
        expect(items[1]).toMatchObject({ progressPercent: 50 });
        expect(items[3]).toMatchObject({ watchedEpisodes: 4, episodes: 10 });
        expect(parse(await tools.getLibraryItems("1")).items[0].watchStatus).toBe("unwatched");
    });
    it("lists ratings and genres, asks Plex for a lean page, and looks users up once", async () => {
        fixture = createClient(() => listing([{ ratingKey: "1", title: "Bluey", type: "show", contentRating: "TV-Y", contentRatingAge: 0,
                Genre: [{ tag: "Animation" }, { tag: "Kids" }], studio: "Ludo", audienceRating: 9.1, leafCount: 10, viewedLeafCount: 0 }]));
        tools = new PlexTools(fixture.client);
        const item = parse(await tools.getLibraryItems("2", undefined, 2000, 0, undefined, "Rhett")).items[0];
        expect(item).toMatchObject({ contentRating: "TV-Y", contentRatingAge: 0, genres: ["Animation", "Kids"], studio: "Ludo", audienceRating: 9.1 });
        const page = fixture.makeRequest.mock.calls.find(([endpoint]) => endpoint === "/library/sections/2/all")?.[1];
        expect(String(page.excludeElements)).toContain("Role");
        expect(String(page.excludeElements)).not.toContain("Genre");
        expect(String(page.excludeElements)).not.toContain("Label");
        await tools.getLibraryItems("2", undefined, 50, 0, undefined, "Rory");
        await tools.searchMedia("bluey", undefined, undefined, 10, 0, "Rhett");
        expect(fixture.makePlexTvRequest.mock.calls.filter(([endpoint]) => endpoint === "/api/users")).toHaveLength(1);
        expect(fixture.makeRequest.mock.calls.filter(([endpoint]) => endpoint === "/accounts")).toHaveLength(1);
    });
    it("passes user and label through the registry", async () => {
        const registry = createPlexToolRegistry(tools);
        const result = parse(await registry.handle("get_library_items", { libraryKey: "1", user: "Rhett", label: "Rhett" }));
        expect(result).toMatchObject({ user: "Rhett", label: "Rhett", totalSize: 1 });
        const details = parse(await registry.handle("get_media_details", { ratingKey: "1", user: "Rhett" }));
        expect(details).toMatchObject({ user: "Rhett", visible: true });
    });
});
