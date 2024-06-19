/// <reference types="vike/types" />

declare global {
  namespace Vike {
    interface PageContext {
      buildDate: Date;
      routeInfo?: {
        title: string;
        label?: string;
      };
    }
  }
}

// If you define Vike.PageContext in a .d.ts file then
// make sure there is at least one export/import statment.
// Tell TypeScript this file isn't an ambient module:
export {};
