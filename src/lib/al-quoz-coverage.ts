import { dubaiLocations } from './locations.ts';

// Al Quoz exists in Dubai coverage. Settings below do not invent subdistricts.
export const alQuozCoverageLocations = dubaiLocations.filter(name => name === 'Al Quoz');
export const alQuozCollectionSettings = [
  { id: 'workshop-release', title: 'Workshop bays & vehicle release', icon: 'sharjah', copy: 'Identify the workshop and exact bay or forecourt position. Explain whether work is complete, who can authorise vehicle release and how recovery equipment can reach the car.', detail: 'Include: premises, bay position and authorised release contact.' },
  { id: 'yard-unit-access', title: 'Industrial yards & unit access', icon: 'access', copy: 'Describe the unit or yard entrance, gate, working space and other parked vehicles. Mention any entry restrictions, narrow approaches or obstacles between the road and the car.', detail: 'Include: gate, approach, nearby vehicles and recovery space.' },
  { id: 'trade-fleet-sites', title: 'Trade sites & several vehicles', icon: 'collection', copy: 'Share a vehicle list, known condition and parking position for each car. Identify the authorised site contact and explain keys, mobility and handover arrangements.', detail: 'Include: vehicle count, individual positions and site contact.' }
] as const;
