/// <reference types="vite/client" />
/// <reference types="@modyfi/vite-plugin-yaml/modules" />

declare module '*.lst' {
  export = string;
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
