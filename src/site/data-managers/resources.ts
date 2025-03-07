export function getResourcePreviewUrl(url: string | undefined) {
  return url
    ?.replace(/^store:\/(.*)\..*/, '/previews/$1.avif')
    .replace(/^https\:\/\/mwscr\.dehero\.site\/uploads\/(.*)\..*/, '/uploads/$1.webp');
}
