import type { SiteRoute, SiteRouteParams } from '../../core/entities/site-route.js';
import { getLocationsPageData } from '../components/LocationsPage/LocationsPage.data.js';
import type { LocationsPageSearchParams } from '../components/LocationsPage/LocationsPage.js';

export interface LocationsRouteParams extends SiteRouteParams, LocationsPageSearchParams {}

export const locationsRoute: SiteRoute<LocationsRouteParams> = {
  path: '/locations',
  meta: () => ({
    title: 'Locations',
    description: 'List of locations of Morrowind.',
  }),
  createUrl: (params) => {
    const searchParams = new URLSearchParams(
      Object.entries(params).filter((item): item is [string, string] => typeof item[1] === 'string'),
    );

    return `/locations/${searchParams.size > 0 ? '?' : ''}${searchParams.toString()}`;
  },
  getData: getLocationsPageData,
};
