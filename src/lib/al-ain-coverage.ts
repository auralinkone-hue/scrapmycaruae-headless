import { otherEmirateLocations } from './locations.ts';

// Existing project coverage supports Al Ain city, not a list of districts.
export const alAinCoverageLocations = otherEmirateLocations.filter(name => name === 'Al Ain');
export const alAinCollectionSettings = [
  { id: 'villa-compound-access', title: 'Villas & compound parking', icon: 'access', copy: 'Share the exact Al Ain location and where the car sits. Describe villa gates, compound entrances, driveway width, nearby vehicles and permission to enter.', detail: 'Useful details: entrance clearance, parking position and access contact.' },
  { id: 'workshop-forecourts', title: 'Workshops & commercial premises', icon: 'sharjah', copy: 'Identify the premises and vehicle position. Mention working bays, other parked cars, gate restrictions and who can authorise vehicle release.', detail: 'Useful details: exact premises, recovery space and release contact.' },
  { id: 'outer-area-parking', title: 'Outer-area parking & approaches', icon: 'al-ain', copy: 'Provide a precise location and describe the approach from the road. Include the ground surface, any restricted entrance and space for recovery equipment.', detail: 'Useful details: road approach, surface and available working space.' }
] as const;
