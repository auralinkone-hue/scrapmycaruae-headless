import { otherEmirateLocations } from './locations.ts';

// Project data supports Umm Al Quwain at emirate level, without district claims.
export const uaqCoverageLocations = otherEmirateLocations.filter(name => name === 'Umm Al Quwain');
export const uaqCollectionSettings = [
  { id: 'compound-parking', title: 'Residential & compound parking', icon: 'access', copy: 'Share the exact Umm Al Quwain location and parking position. Describe gates, nearby vehicles, entrance clearance and permission to enter. For building parking, include ramps and clearance limits.', detail: 'Useful details: entrance, parking position and access contact.' },
  { id: 'workshop-access', title: 'Workshop bays & forecourts', icon: 'sharjah', copy: 'Identify the premises and where the car sits. Mention working bays, other vehicles, gate restrictions and who can authorise release. Explain the route from the entrance to the car.', detail: 'Useful details: premises, recovery space and release contact.' },
  { id: 'industrial-plots', title: 'Industrial plots & several vehicles', icon: 'collection', copy: 'For a plot or storage site, describe the approach, surface, gate and working space. For several vehicles, include a list and the position and known mobility of each car.', detail: 'Useful details: site entry, individual conditions and handover arrangements.' }
] as const;
