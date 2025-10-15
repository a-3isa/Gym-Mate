import { BACKEND_API_URL } from '@env';

if (!BACKEND_API_URL) {
  throw new Error('BACKEND_API_URL is not set. Please configure it in your .env file.');
}

export const API_BASE = BACKEND_API_URL;

const resolvedUrl = new URL(API_BASE);
const segments = resolvedUrl.pathname.split('/').filter(Boolean);

if (segments.length > 0 && segments[segments.length - 1].toLowerCase() === 'api') {
  segments.pop();
}

const normalizedPath = segments.length > 0 ? `/${segments.join('/')}` : '';
export const API_ORIGIN = `${resolvedUrl.origin}${normalizedPath}`;

export function normalizeUrl(...parts: string[]): string {
  const sanitizedParts = parts.filter((part) => typeof part === 'string' && part.length > 0);

  if (sanitizedParts.length === 0) {
    throw new Error('normalizeUrl requires at least one non-empty part.');
  }

  return sanitizedParts.reduce<string | null>((acc, part) => {
    if (acc === null) {
      return part.replace(/\/+$/, '');
    }

    const trimmedBase = acc.replace(/\/+$/, '');
    const trimmedPart = part.replace(/^\/+/, '').replace(/\/+$/, '');

    if (trimmedPart.length === 0) {
      return trimmedBase;
    }

    return `${trimmedBase}/${trimmedPart}`;
  }, null) as string;
}

export function toAbsolute(path: string): string {
  return normalizeUrl(API_ORIGIN, path);
}
