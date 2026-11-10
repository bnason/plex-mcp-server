/**
 * MCP tool schema definitions for Trakt tools.
 * Mirrors the pattern from plex/tool-schemas.ts.
 */
export declare const TRAKT_TOOL_SCHEMAS: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            state: {
                type: string;
                description: string;
            };
            code?: undefined;
            dryRun?: undefined;
            batchSize?: undefined;
            includeProgress?: undefined;
            userId?: undefined;
            ratingKey?: undefined;
            title?: undefined;
            progress?: undefined;
            duration?: undefined;
            query?: undefined;
            type?: undefined;
            year?: undefined;
            limit?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            state?: undefined;
            code: {
                type: string;
                description: string;
            };
            dryRun?: undefined;
            batchSize?: undefined;
            includeProgress?: undefined;
            userId?: undefined;
            ratingKey?: undefined;
            title?: undefined;
            progress?: undefined;
            duration?: undefined;
            query?: undefined;
            type?: undefined;
            year?: undefined;
            limit?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            state?: undefined;
            code?: undefined;
            dryRun?: undefined;
            batchSize?: undefined;
            includeProgress?: undefined;
            userId?: undefined;
            ratingKey?: undefined;
            title?: undefined;
            progress?: undefined;
            duration?: undefined;
            query?: undefined;
            type?: undefined;
            year?: undefined;
            limit?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            state?: undefined;
            code?: undefined;
            dryRun: {
                type: string;
                description: string;
                default: boolean;
            };
            batchSize: {
                type: string;
                description: string;
                default: number;
            };
            includeProgress: {
                type: string;
                description: string;
                default: boolean;
            };
            userId?: undefined;
            ratingKey?: undefined;
            title?: undefined;
            progress?: undefined;
            duration?: undefined;
            query?: undefined;
            type?: undefined;
            year?: undefined;
            limit?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            state?: undefined;
            code?: undefined;
            dryRun?: undefined;
            batchSize?: undefined;
            includeProgress?: undefined;
            userId: {
                type: string;
                description: string;
            };
            ratingKey?: undefined;
            title?: undefined;
            progress?: undefined;
            duration?: undefined;
            query?: undefined;
            type?: undefined;
            year?: undefined;
            limit?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            state?: undefined;
            code?: undefined;
            dryRun?: undefined;
            batchSize?: undefined;
            includeProgress?: undefined;
            userId?: undefined;
            ratingKey: {
                type: string;
                description: string;
            };
            title: {
                type: string;
                description: string;
            };
            type: {
                type: string;
                enum: string[];
                description: string;
            };
            progress: {
                type: string;
                description: string;
            };
            duration: {
                type: string;
                description: string;
            };
            query?: undefined;
            year?: undefined;
            limit?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            state?: undefined;
            code?: undefined;
            dryRun?: undefined;
            batchSize?: undefined;
            includeProgress?: undefined;
            userId?: undefined;
            ratingKey?: undefined;
            title?: undefined;
            progress?: undefined;
            duration?: undefined;
            query: {
                type: string;
                description: string;
            };
            type: {
                type: string;
                enum: string[];
                description: string;
            };
            year: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
                default: number;
            };
        };
        required: string[];
    };
})[];
