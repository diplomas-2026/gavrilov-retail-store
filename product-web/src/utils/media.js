export function resolveMediaUrl(url) {
  if (!url) {
    return '';
  }

  if (url.startsWith('/images/products/')) {
    return url.replace('/images/products/', '/product-images/products/');
  }

  if (url.startsWith('/')) {
    return url;
  }

  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      const safePath = parsed.pathname.startsWith('/images/products/')
        ? parsed.pathname.replace('/images/products/', '/product-images/products/')
        : parsed.pathname;
      return `${window.location.origin}${safePath}${parsed.search}${parsed.hash}`;
    }
    if (window?.location?.origin && url.startsWith(`${window.location.origin}/images/products/`)) {
      return url.replace(`${window.location.origin}/images/products/`, `${window.location.origin}/product-images/products/`);
    }
    return url;
  } catch {
    return url;
  }
}
