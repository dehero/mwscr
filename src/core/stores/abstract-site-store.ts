import type { Store } from '../entities/store.js';
import { site } from '../services/site.js';

export abstract class AbstractSiteStore implements Store {
  readonly name = 'Site';

  readonly include = [
    'shots/*.png',
    'drawings/*.{png,webp,jpg}',
    'wallpapers/*.png',
    'videos/*.{mp4,avi,jpg,webm}',
    'news/*.{jpg,png}',
    'photoshops/*.{jpg,png}',
    'snapshots/*.{jpg,png}',
    'outtakes/*.{jpg,png}',
    'avatars/*.jpg',
    'photos/*.jpg',
    'inbox/*.{jpg,png}',
    'misc/*.txt',
  ];

  readonly protectedDirectories = ['inbox', 'misc'];

  protected abstract getSecretKey(): string | undefined;

  protected toRealPath(path: string): string | undefined {
    for (const protectedDirectory of this.protectedDirectories) {
      if (path === protectedDirectory) {
        const secretKey = this.getSecretKey();
        if (!secretKey) {
          return undefined;
        }
        return `${protectedDirectory}.${secretKey}`;
      }

      const pattern = `${protectedDirectory}/`;
      if (path.startsWith(pattern)) {
        const secretKey = this.getSecretKey();
        if (!secretKey) {
          return undefined;
        }
        return `${protectedDirectory}.${secretKey}/` + path.slice(pattern.length);
      }
    }

    return path;
  }

  protected unprotectFolderName(name: string): string {
    const secretFolderPattern = new RegExp(`\\.${this.getSecretKey()}$`);

    return name.replace(secretFolderPattern, '');
  }

  getPublicUrl(path: string): string | undefined {
    const realPath = this.toRealPath(path);
    if (!realPath) {
      return undefined;
    }
    return `${site.origin}/store/${realPath}`;
  }

  getPreviewUrl(path: string) {
    return `${site.origin}/previews/${path.replace(/(.*)\..*/, '/previews/$1.avif')}`;
  }
}
