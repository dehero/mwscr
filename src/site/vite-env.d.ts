/// <reference types="vite/client" />
/// <reference types="../core/entities/location-info.js" />
/// <reference types="../core/entities/post-info.js" />
/// <reference types="../core/entities/user-info.js" />

declare module '*.json' {
  const value: object;
  export = value;
}

interface OutputMetadata {
  src: string; // URL of the generated image
  width: number; // Width of the image
  height: number; // Height of the image
  format: string; // Format of the generated image

  // The following options are the same as sharps input options
  space: string; // Name of colour space interpretation
  channels: number; // Number of bands e.g. 3 for sRGB, 4 for CMYK
  density: number; //  Number of pixels per inch
  depth: string; // Name of pixel depth format
  hasAlpha: boolean; // presence of an alpha transparency channel
  hasProfile: boolean; // presence of an embedded ICC profile
  isProgressive: boolean; // indicating whether the image is interlaced using a progressive scan
}

declare module '*&as=metadata&imagetools-gallery' {
  const outputs: Array<OutputMetadata>;
  export default outputs;
}

declare module '*&as=metadata&imagetools' {
  const outputs: OutputMetadata;
  export default outputs;
}

declare module '*&imagetools-gallery' {
  const outputs: Array<string>;
  export default outputs;
}

declare module '*&imagetools' {
  const outputs: string;
  export default outputs;
}

declare module '*.md' {
  // "unknown" would be more detailed depends on how you structure frontmatter
  const attributes: Record<string, unknown>;

  // When "Mode.TOC" is requested
  const toc: { level: string; content: string }[];

  // When "Mode.HTML" is requested
  const html: string;

  // Modify below per your usage
  export { attributes, html, toc };
}

// TODO: remove when @minht11/solid-virtual-container typings get fixed
declare module '@minht11/solid-virtual-container' {
  import type { JSX } from 'solid-js';

  export declare type ScrollDirection = 'vertical' | 'horizontal';

  export interface VirtualItemProps<T> {
    items: readonly T[];
    item: T;
    index: number;
    tabIndex: number;
    style: Record<string, string | number | undefined>;
  }

  export interface VirtualItemSizeStatic {
    width?: number;
    height?: number;
  }

  export declare type VirtualItemSizeDynamic = (
    crossAxisContentSize: number,
    isHorizontal: boolean,
  ) => VirtualItemSizeStatic;

  export declare type VirtualItemSize = VirtualItemSizeStatic | VirtualItemSizeDynamic;

  export interface Axis {
    main: number;
    cross: number;
  }

  export interface CrossAxisCountOptions {
    target: Axis;
    container: Axis;
    itemSize: Axis;
  }

  export interface VirtualContainerProps<T> {
    items: readonly T[];
    itemSize: VirtualItemSize;
    scrollTarget?: HTMLElement;
    direction?: ScrollDirection;
    overscan?: number;
    className?: string;
    role?: JSX.HTMLAttributes<HTMLDivElement>['role'];
    crossAxisCount?: (measurements: CrossAxisCountOptions, itemsCount: number) => number;
    children: (props: VirtualItemProps<T>) => JSX.Element;
  }

  export declare function VirtualContainer<T>(props: VirtualContainerProps<T>): JSX.Element;
}
