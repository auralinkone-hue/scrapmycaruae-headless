import { sharjahLocations } from './locations.ts';

const notes = [
  { id: 'al-sajaa', short: 'Sajaa / Al Sajaa', icon: 'sharjah', context: 'Yards & industrial premises', copy: 'For Al Sajaa Industrial Area, share the exact yard, gate and vehicle position. Include who can authorise entry and release, any working-space restrictions and the known mobility of each vehicle.', checks: ['Yard entrance and available space', 'Site contact and release permission', 'Vehicle count and condition'] },
  { id: 'industrial-area', short: 'Industrial Area', icon: 'collection', context: 'Workshops & commercial parking', copy: 'For Sharjah Industrial Area, identify the specific premises and where the car is parked. Workshop entrances, nearby vehicles and narrow approaches may affect how recovery equipment can reach it.', checks: ['Specific premises and parking position', 'Entrance width and obstacles', 'Keys, rolling and steering information'] },
  { id: 'al-nahda', short: 'Al Nahda', icon: 'access', context: 'Residential & managed parking', copy: 'For Al Nahda, explain whether the car is in street-level, building or basement parking. Share the parking level, ramp clearance and any building or security permission needed for access.', checks: ['Parking level and entrance clearance', 'Ramp and gate restrictions', 'Building access and handover contact'] }
];
export const sharjahCoverage = notes.map((note, index) => ({ ...note, name: sharjahLocations[index] }));
