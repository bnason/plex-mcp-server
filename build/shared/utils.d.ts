/**
 * Shared utility functions used across Plex and Trakt modules
 */
/**
 * Validate that a value is a numeric Plex ID (ratingKey, libraryKey, playlistId, etc.)
 * Prevents path traversal and injection when interpolated into API URLs.
 */
export declare function validatePlexId(value: string | undefined, paramName: string): string;
export declare function sleep(ms: number): Promise<void>;
export declare function chunkArray<T>(array: T[], chunkSize: number): T[][];
export declare function truncate(str: string, maxLen: number): string;
/**
 * Sanitize search query: limit length and strip control characters
 * @param query Raw search query from user
 * @param maxLength Maximum allowed length (default 500)
 * @returns Sanitized query safe for API calls
 * @throws McpError if query is empty or invalid after sanitization
 */
export declare function sanitizeSearchQuery(query: string | undefined, maxLength?: number): string;
/**
 * Validate that a Plex API MediaContainer response has expected shape.
 * Throws McpError if validation fails.
 */
export declare function validatePlexMediaContainer(data: unknown, expectedFields?: string[]): {
    MediaContainer?: {
        Metadata?: Record<string, unknown>[];
    };
};
/**
 * Validate that a Plex API response has expected totalSize field.
 */
export declare function validatePlexTotalSize(data: unknown): {
    MediaContainer?: {
        Metadata?: Record<string, unknown>[];
        totalSize?: number;
    };
};
