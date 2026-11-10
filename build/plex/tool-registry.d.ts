/**
 * Tool Registry — eliminates switch statements for tool dispatch.
 */
import { PlexTools } from "./tools.js";
import { MCPResponse } from "./types.js";
type ToolHandler = (args: Record<string, unknown>) => Promise<MCPResponse>;
type TraktStatsProvider = {
    traktGetUserStats(): Promise<Record<string, unknown>>;
    getWatchedMovieTitles(): Promise<Array<{
        title: string;
        year: number;
        plays: number;
    }> | null>;
};
type ToolRegistryOptions = {
    includeMutative?: boolean;
    traktFunctions?: TraktStatsProvider;
};
export declare class ToolRegistry {
    private handlers;
    register(name: string, handler: ToolHandler): void;
    has(name: string): boolean;
    handle(name: string, args?: Record<string, unknown>): Promise<MCPResponse>;
}
/** Pre-registers Plex tools; mutative tools are optional */
export declare function createPlexToolRegistry(tools: PlexTools, options?: ToolRegistryOptions): ToolRegistry;
export {};
