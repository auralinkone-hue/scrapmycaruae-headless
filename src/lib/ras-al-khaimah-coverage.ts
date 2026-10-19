import { otherEmirateLocations } from './locations.ts';

// Existing coverage supports the emirate, not a list of named RAK districts.
export const rakCoverageLocations = otherEmirateLocations.filter(name => name === 'Ras Al Khaimah');
export const rakCollectionSettings = [
  { id: 'compound-parking', title: 'Residential parking & compounds', icon: 'access', copy: 'Share the exact location, parking position and entrance route. For a compound or building, include gates, clearance, nearby vehicles and permission to enter.', detail: 'Include: entrance clearance, parking level and access contact.' },
  { id: 'commercial-premises', title: 'Workshops & industrial plots', icon: 'sharjah', copy: 'Describe where the car sits within the premises, the gate and available recovery space. Mention working areas, other parked vehicles and who can authorise release.', detail: 'Include: premises location, vehicle position and handover contact.' },
  { id: 'outer-area-access', title: 'Outer-area parking & open sites', icon: 'ras-al-khaimah', copy: 'Provide the precise location and describe the approach from the road. Mention the surface, entrance width, any restrictions and space for recovery equipment. An open site still needs an access review.', detail: 'Include: road approach, ground conditions and recovery space.' }
] as const;
