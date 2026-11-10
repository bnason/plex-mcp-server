/**
 * The tools advertised by tools/list.
 *
 * Write tools are only listed when PLEX_ENABLE_MUTATIVE_OPS=true. Calling one
 * while disabled is still refused by the Plex registry; this keeps clients
 * from being offered tools that can only fail.
 */
export declare function listedToolSchemas(): import("./tool-annotations.js").Annotated<{
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {};
    };
}>[];
