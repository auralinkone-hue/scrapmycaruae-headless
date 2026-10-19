import { otherEmirateLocations } from './locations.ts';

// Coverage supports Fujairah at emirate level; do not invent district coverage.
export const fujairahCoverageLocations = otherEmirateLocations.filter(name => name === 'Fujairah');
export const fujairahCollectionSettings = [
  { id: 'residential-compounds', title: 'Residential parking & compounds', icon: 'access', copy: 'Share the exact Fujairah location, parking position and route to the car. Include compound gates, basement clearance, nearby vehicles and any entry permissions.', detail: 'Include: entrance width, clearance and access contact.' },
  { id: 'workshops-industrial-plots', title: 'Workshops & industrial plots', icon: 'sharjah', copy: 'Identify the premises and where the vehicle sits. Describe working bays, plot entrances, other vehicles and available space for recovery equipment. Explain who can authorise release.', detail: 'Include: vehicle position, recovery space and release contact.' },
  { id: 'outer-area-approaches', title: 'Outer-area parking & road approaches', icon: 'fujairah', copy: 'Provide a precise location and describe the route from the road. Mention slopes, ground surface, gates, restricted entrances and working space so practical access can be reviewed.', detail: 'Include: road approach, surface and any access restrictions.' }
] as const;
