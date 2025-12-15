export function getResourcePreviewUrl(url: string | undefined) {
  return url
    ?.replace(/^store:\/(.*)\..*/, '/previews/$1.avif')
    .replace(/^https\:\/\/mwscr\.dehero\.site\/uploads\/(.*)\..*/, '/uploads/$1.preview.webp');
}

// TODO: create lightweight video version and preview image automatically. Now used manual scripts:
// `ffmpeg -i input.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 -b:a 128k -c:a libopus output.webm`
// `ffmpeg -ss 00:00:01.00 -i input.mp4 -qscale:v 2 -vframes 1 output.jpg`
// https://stackoverflow.com/questions/47510489/ffmpeg-convert-mp4-to-webm-poor-results
// https://stackoverflow.com/questions/27145238/create-thumbnail-from-video-using-ffmpeg
// https://stackoverflow.com/questions/10225403/how-can-i-extract-a-good-quality-jpeg-image-from-a-video-file-with-ffmpeg

export function getVideoLightweightUrl(url: string) {
  return url.replace(/.(mp4|avi)$/, '.webm');
}

export function getVideoPosterUrl(url: string) {
  return url.replace(/.(mp4|avi)$/, '.jpg');
}
