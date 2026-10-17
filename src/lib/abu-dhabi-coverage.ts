import { abuDhabiLocations } from './locations.ts';

// Same-page guide IDs can be retained when dedicated area pages are introduced.
const groups = [
  { id: 'musaffah', name: 'Musaffah', shortName: 'Musaffah', icon: 'sharjah', type: 'Industrial & commercial', names: ['Musaffah'], copy: 'For workshop premises, storage yards or fleet parking, share the exact gate, vehicle position and the person who can authorise entry and release. Mention any limits on recovery equipment or working space.' },
  { id: 'mohammed-bin-zayed-city', name: 'Mohammed Bin Zayed City & nearby communities', shortName: 'MBZ City & communities', icon: 'access', type: 'Compounds & residential parking', names: ['Mohammed Bin Zayed City', 'Shakhbout City', 'Al Reef', 'Al Ghadeer'], copy: 'Describe the building or compound, parking position and any gate or security arrangements. For a car that cannot move, include the available space and what is known about wheel and steering movement.' },
  { id: 'khalifa-city', name: 'Khalifa City', shortName: 'Khalifa City', icon: 'access', type: 'Villas & managed entrances', names: ['Khalifa City'], copy: 'Tell us whether the car is on a driveway, inside a compound or in managed parking. Entrance width, gates, nearby vehicles and permission to enter can affect a practical collection plan.' },
  { id: 'city-waterfront', name: 'City & waterfront areas', shortName: 'City & waterfront', icon: 'abu-dhabi', type: 'Street, tower & basement parking', names: [], copy: 'For city streets, towers and waterfront communities, share the parking level, entrance clearance and building access arrangements. A location name alone does not explain the route from the car to the road.' }
];
const named = groups.flatMap(group => group.names);
export const abuDhabiCoverageGroups = groups.map(group => ({ ...group, areas: group.id === 'city-waterfront' ? abuDhabiLocations.filter(area => !named.includes(area)) : abuDhabiLocations.filter(area => group.names.includes(area)) }));
