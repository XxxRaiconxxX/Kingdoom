export function getOptimizedImageUrl(url: string, width: number = 400, quality: number = 80): string {
  if (!url) return url;
  
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname.includes('supabase.co')) {
      // Transform public supabase storage URL into an optimized render URL
      if (parsedUrl.pathname.includes('/object/public/')) {
        parsedUrl.pathname = parsedUrl.pathname.replace('/object/public/', '/render/image/public/');
        parsedUrl.searchParams.set('width', width.toString());
        parsedUrl.searchParams.set('quality', quality.toString());
        parsedUrl.searchParams.set('format', 'webp'); // Force WebP format for better compression
        return parsedUrl.toString();
      }
    }
    return url; // Return original if not Supabase
  } catch (e) {
    // If invalid URL, return as is
    return url;
  }
}
