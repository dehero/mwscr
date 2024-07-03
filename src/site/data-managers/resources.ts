export function getResourcePreviewUrl(url: string | undefined) {
  return url?.replace(/^store:\/(.*)\..*/, '/previews/$1.avif');
}
