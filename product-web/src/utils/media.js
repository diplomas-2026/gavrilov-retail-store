export function resolveMediaUrl(url) {
  if (!url) {
    return '';
  }

  if (url.startsWith('/')) {
    return url;
  }

  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      return `${window.location.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    return url;
  } catch {
    return url;
  }
}
