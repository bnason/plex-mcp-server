/**
 * Trakt Tool Registry — eliminates switch statement for Trakt tool dispatch.
 * Reuses ToolRegistry class from plex/tool-registry.ts.
 */
import { ToolRegistry } from "../plex/tool-registry.js";
import { TraktMCPFunctions } from "./mcp-functions.js";
export declare function createTraktToolRegistry(traktFunctions: TraktMCPFunctions): ToolRegistry;
