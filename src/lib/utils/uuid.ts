/**
 * Generate a UUID v4 string using Node.js crypto module.
 * No external dependencies required.
 */
export function generateId(): string {
	return crypto.randomUUID();
}
