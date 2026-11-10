/**
 * MCP tool schema definitions for Plex tools.
 * Defined once, used by both servers.
 */
export declare const PLEX_CORE_TOOL_SCHEMAS: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {};
    };
}[];
/** All Plex tool schemas */
/** Mutative tools (12 tools) — registered only when opt-in is enabled */
export declare const PLEX_MUTATIVE_TOOL_SCHEMAS: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            title: {
                type: string;
                description: string;
            };
            type: {
                type: string;
                description: string;
                enum: string[];
            };
            ratingKeys: {
                type: string;
                description: string;
                items: {
                    type: string;
                };
            };
            smart: {
                type: string;
                description: string;
                default: boolean;
            };
            librarySectionId: {
                type: string;
                description: string;
            };
            libtype: {
                type: string;
                description: string;
                enum: string[];
            };
            smartFilter: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            playlistId: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            ratingKey: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            plexGuid: {
                type: string;
                description: string;
            };
            ratingKey: {
                type: string;
                description: string;
            };
        };
        oneOf: {
            required: string[];
            not: {
                required: string[];
            };
        }[];
    };
})[];
export declare const PLEX_TOOL_SCHEMAS: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {};
    };
}[];
