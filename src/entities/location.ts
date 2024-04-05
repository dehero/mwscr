export function areNestedLocations(location1: string, location2: string) {
  return location1.startsWith(location2) || location2.startsWith(location1);
}
