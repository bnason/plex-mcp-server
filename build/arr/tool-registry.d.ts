/**
 * Arr Tool Registry — eliminates switch statement for Sonarr/Radarr tool dispatch.
 * Reuses ToolRegistry class from plex/tool-registry.ts.
 */
import { ToolRegistry } from "../plex/tool-registry.js";
import { ArrMCPFunctions } from "./mcp-functions.js";
export declare function createArrToolRegistry(arrFunctions: ArrMCPFunctions): ToolRegistry;
