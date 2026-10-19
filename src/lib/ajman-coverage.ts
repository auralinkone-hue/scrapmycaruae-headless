import { otherEmirateLocations } from './locations.ts';

// Ajman is supported at city level. Do not invent named districts or branches.
export const ajmanCoverageLocations = otherEmirateLocations.filter(location => location === 'Ajman');
export const ajmanCollectionSettings = [
  { id: 'residential-parking', title: 'Residential streets & parking', icon: 'access', copy: 'Share the exact Ajman location and whether the car is on a street, driveway or in building parking. Entrance width, parked vehicles, basement clearance and building permissions can affect the route out.', detail: 'Useful details: parking position, entrance clearance and who can provide access.' },
  { id: 'workshop-access', title: 'Workshops & forecourts', icon: 'sharjah', copy: 'Identify the workshop or premises and where the vehicle sits. Describe gates, nearby cars, any work area restrictions and who can authorise the vehicle’s release.', detail: 'Useful details: exact premises, gate, available recovery space and release contact.' },
  { id: 'industrial-yards', title: 'Industrial yards & several vehicles', icon: 'collection', copy: 'For a yard or a site with multiple vehicles, include a vehicle list and the parking position of each car. Known mobility and site entry requirements may need a separate review for every vehicle.', detail: 'Useful details: vehicle count, individual condition, site entry and handover arrangements.' }
] as const;
