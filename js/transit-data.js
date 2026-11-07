/*
 * Jebel Ali & Discovery Gardens Transit Guide - network data (v1.2.0)
 * ------------------------------------------------------------------
 * SOURCES AND CONFIDENCE
 *  - Nol fares (Silver 3 / 5 / 7.50, Gold 6 / 10 / 15) and the 30-minute transfer rule are from the RTA Nol fares
 *    page (rta.ae). A transfer within 30 minutes is charged as ONE journey by total zones; it is not free.
 *  - Route termini follow RTA's route list: F43 Ibn Battuta MS - Discovery Gardens, F44 Energy MS - Jebel Ali Gardens,
 *    F46 Ibn Battuta MS - DIP, F54 Danube MS - JAFZA South, 99 Jebel Ali Bus Stn - UAE Exchange MS,
 *    91 Al Ghubaiba - Jebel Ali Bus Stn (only the Jebel Ali end is modelled here).
 *  - Intermediate stops, Metro exits and headways come from the project brief and could NOT be checked against a
 *    public source. Stop-to-stop minutes, 99/91 headways, fare zones per route and the Metro train frequency are
 *    ESTIMATES. Always confirm with RTA / S'hail / Dubai Drive.
 *
 * Times may run past midnight using 24h+ notation ("26:00" = 02:00 next day).
 * Bump APP_VERSION here, in sw.js (VERSION) together when you change anything.
 */
window.TRANSIT_DATA = {
  APP_VERSION: '1.2.1',
  DATA_VERSION: '2026.11.2',

  // metro:true = stop is at a Red Line station (interchange). shelter: ac | covered | open. walk = exit guidance (from brief).
  stops: [
    { id: 'IBN_B2',   name: 'Ibn Battuta Bus Station, Bay 2',        short: 'Ibn Battuta B2', type: 'bus', shelter: 'ac', metro: true, metroName: 'Ibn Battuta',
      walk: 'Bays 2, 3, 5, 6: 3 min covered walkway from the Red Line platforms' },
    { id: 'IBN_B3',   name: 'Ibn Battuta Bus Station, Bay 3',        short: 'Ibn Battuta B3', type: 'bus', shelter: 'ac', metro: true, metroName: 'Ibn Battuta',
      walk: 'Bays 2, 3, 5, 6: 3 min covered walkway from the Red Line platforms' },
    { id: 'IBN_B6',   name: 'Ibn Battuta Bus Station, Bay 6',        short: 'Ibn Battuta B6', type: 'bus', shelter: 'ac', metro: true, metroName: 'Ibn Battuta',
      walk: 'Bays 2, 3, 5, 6: 3 min covered walkway from the Red Line platforms' },
    { id: 'DG_01',    name: 'Discovery Gardens 1',                   short: 'DG 1',           type: 'bus', shelter: 'covered' },
    { id: 'DG_08',    name: 'Discovery Gardens 8',                   short: 'DG 8',           type: 'bus', shelter: 'covered' },
    { id: 'DG_13',    name: 'Discovery Gardens 13-16',               short: 'DG 13-16',       type: 'bus', shelter: 'covered' },
    { id: 'DG_16',    name: 'Discovery Gardens 16',                  short: 'DG 16',          type: 'bus', shelter: 'covered' },
    { id: 'DG_METRO', name: 'Discovery Gardens Metro Station',       short: 'DG Metro',       type: 'bus', shelter: 'ac', metro: true, metroName: 'Discovery Gardens',
      walk: 'Exit 1 (Gardens side): 2 min to the F43 bay. Exit 2 (Discovery Pavilions side): 3 min' },
    { id: 'GARDENS',  name: 'The Gardens Metro Bus Stop',            short: 'The Gardens',    type: 'bus', shelter: 'ac', metro: true, metroName: 'The Gardens',
      walk: 'Exit 1 (Gardens Boulevard): 2 min walk' },
    { id: 'FURJAN',   name: 'Al Furjan Metro Bus Stop',              short: 'Al Furjan',      type: 'bus', shelter: 'ac', metro: true, metroName: 'Al Furjan' },
    { id: 'ENERGY_LS',name: 'Energy Metro Bus Stop (Landside)',      short: 'Energy',         type: 'bus', shelter: 'ac', metro: true, metroName: 'Energy' },
    { id: 'FEST3',    name: 'Festival Plaza 3',                      short: 'Festival Plaza', type: 'bus', shelter: 'covered' },
    { id: 'MUNT',     name: 'Muntazah Complex',                      short: 'Muntazah',       type: 'bus', shelter: 'covered' },
    { id: 'LIFELINE', name: 'Lifeline Hospital',                     short: 'Lifeline Hosp.', type: 'bus', shelter: 'covered' },
    { id: 'JAG_1',    name: 'Jebel Ali Gardens 1',                   short: 'JA Gardens 1',   type: 'bus', shelter: 'open' },
    { id: 'JAG_13',   name: 'Jebel Ali Gardens 13',                  short: 'JA Gardens 13',  type: 'bus', shelter: 'open' },
    { id: 'DIP_METRO',name: 'Dubai Investment Park Metro Station',   short: 'DIP Metro',      type: 'bus', shelter: 'ac', metro: true, metroName: 'DIP' },
    { id: 'DUNES',    name: 'Dunes Village / AMB',                   short: 'Dunes Village',  type: 'bus', shelter: 'open' },
    { id: 'DANUBE_SEA',name: 'Danube Metro Seaside Bus Stop',        short: 'Danube Seaside', type: 'bus', shelter: 'ac', metro: true, metroName: 'Danube',
      walk: 'Seaside exit: direct escalator to the F54 stop' },
    { id: 'JRA5',     name: 'JAFZA Roundabout 5',                    short: 'JAFZA RA 5',     type: 'bus', shelter: 'open' },
    { id: 'JRA6',     name: 'JAFZA Roundabout 6',                    short: 'JAFZA RA 6',     type: 'bus', shelter: 'open' },
    { id: 'JRA8',     name: 'JAFZA Roundabout 8',                    short: 'JAFZA RA 8',     type: 'bus', shelter: 'open' },
    { id: 'JRA12',    name: 'JAFZA Roundabout 12',                   short: 'JAFZA RA 12',    type: 'bus', shelter: 'open' },
    { id: 'LIFE',     name: 'Life Pharmacy Metro Stop',              short: 'Life Pharmacy',  type: 'bus', shelter: 'ac', metro: true, metroName: 'Life Pharmacy' },
    { id: 'UAEX',     name: 'UAE Exchange Metro Bus Stop',           short: 'UAE Exchange',   type: 'bus', shelter: 'ac', metro: true, metroName: 'UAE Exchange',
      walk: 'Direct ground-level transfer to the JAFZA South terminal' },
    { id: 'JS_ACC',   name: 'JAFZA South Accommodations',            short: 'JAFZA S. Accom.',type: 'bus', shelter: 'covered' },
    { id: 'JN',       name: 'JAFZA North',                           short: 'JAFZA North',    type: 'bus', shelter: 'covered' },
    { id: 'JS',       name: 'JAFZA South',                           short: 'JAFZA South',    type: 'bus', shelter: 'covered' },
    { id: 'JIND',     name: 'Jebel Ali Industrial Area',             short: 'JA Industrial',  type: 'bus', shelter: 'open' },
    { id: 'JA_BUS',   name: 'Jebel Ali Bus Station',                 short: 'Jebel Ali Bus Stn', type: 'bus', shelter: 'ac' }
  ],

  // Shift windows in minutes from midnight (15-minute margin each side so border-time buses are never hidden).
  shifts: {
    now:     { label: 'Next buses', range: null },
    morning: { label: 'Morning 05:00-08:30', short: 'Morning', range: [285, 525] },
    evening: { label: 'Evening 16:30-20:30', short: 'Evening', range: [975, 1245] },
    night:   { label: 'Night 21:00-02:00',   short: 'Night',   range: [1245, 1575] }
  },

  areas: { all: 'All zones', dg: 'Discovery Gardens', jafza: 'JAFZA', dip: 'DIP & Furjan' },

  // Official RTA Nol fare structure (rta.ae/Nol-Fares). zones: 1 = within 1 zone, 2 = 2 adjacent zones, 3 = more than 2.
  fares: {
    zones: { 1: { silver: 3, gold: 6 }, 2: { silver: 5, gold: 10 }, 3: { silver: 7.5, gold: 15 } },
    transferMinutes: 30,
    note: 'Metro transfer within 30 min counts as one journey (fare by total zones)',
    minBalance: 7.5   // from the project brief; the RTA fare page does not state a minimum
  },

  // Red Line train estimate for the Transfer tile (illustrative headways).
  metro: {
    windows: [['05:00', '08:00', 6], ['08:00', '16:00', 8], ['16:00', '21:00', 6], ['21:00', '24:00', 10]],
    otherDirOffset: 2
  },

  // stops: [stopId, minutes from first stop] outbound (towards JAFZA / DIP / Furjan / Jebel Ali). Inbound = reverse.
  // zones = assumed fare band for the route (confirm in S'hail). ink = text colour on the route colour.
  routes: [
    {
      id: 'F43', color: '#ff6b00', ink: '#111', areas: ['dg'], zones: 1, inShift: 6,
      note: 'Discovery Gardens circular: Ibn Battuta - Discovery Gardens - The Gardens - Al Furjan',
      stops: [['IBN_B6', 0], ['DG_01', 6], ['DG_08', 10], ['DG_16', 14], ['DG_METRO', 18], ['GARDENS', 22], ['FURJAN', 29]],
      windows: [['05:00', '08:30', 12], ['08:30', '16:30', 20], ['16:30', '20:30', 15], ['20:30', '24:00', 20]]
    },
    {
      id: 'F44', color: '#1565c0', ink: '#fff', areas: ['dg'], zones: 1, inShift: 8,
      note: 'Energy Metro - Festival Plaza - Muntazah - Jebel Ali Gardens - Ibn Battuta',
      stops: [['ENERGY_LS', 0], ['FEST3', 6], ['MUNT', 10], ['LIFELINE', 14], ['JAG_1', 18], ['JAG_13', 25], ['IBN_B3', 33]],
      windows: [['05:15', '08:45', 15], ['08:45', '16:30', 20], ['16:30', '20:45', 15], ['20:45', '24:00', 20]]
    },
    {
      id: 'F46', color: '#00b3a0', ink: '#111', areas: ['dg', 'dip'], zones: 2, inShift: 7,
      note: 'Ibn Battuta - Discovery Gardens 13-16 - DIP Metro - Dunes Village / AMB',
      stops: [['IBN_B2', 0], ['DG_13', 8], ['DIP_METRO', 24], ['DUNES', 31]],
      windows: [['05:00', '08:30', 15], ['08:30', '16:30', 20], ['16:30', '20:30', 15], ['20:30', '24:00', 20]]
    },
    {
      id: 'F54', color: '#7b2cbf', ink: '#fff', areas: ['jafza'], zones: 2, inShift: 9,
      note: 'Danube Seaside - JAFZA roundabouts 5, 6, 8, 12 - Life Pharmacy - UAE Exchange - JAFZA South Accommodations',
      stops: [['DANUBE_SEA', 0], ['JRA5', 8], ['JRA6', 12], ['JRA8', 16], ['JRA12', 21], ['LIFE', 28], ['UAEX', 33], ['JS_ACC', 40]],
      windows: [['05:30', '08:30', 20], ['08:30', '16:30', 30], ['16:30', '20:30', 20], ['20:30', '24:00', 30]]
    },
    {
      id: '99', color: '#f4a100', ink: '#111', areas: ['jafza'], zones: 2, inShift: 10,
      note: 'Trunk: UAE Exchange Metro - JAFZA North - JAFZA South - Jebel Ali Bus Station',
      stops: [['UAEX', 0], ['JN', 12], ['JS', 22], ['JA_BUS', 34]],
      windows: [['05:00', '08:30', 18], ['08:30', '16:30', 30], ['16:30', '20:30', 18], ['20:30', '25:30', 30]]
    },
    {
      id: '91', color: '#c62828', ink: '#fff', areas: ['jafza'], zones: 2, inShift: 9,
      note: 'Trunk: Energy Metro - JAFZA South - Jebel Ali Industrial - Jebel Ali Bus Station (late-night service)',
      stops: [['ENERGY_LS', 0], ['JS', 20], ['JIND', 30], ['JA_BUS', 40]],
      windows: [['05:00', '08:30', 20], ['08:30', '16:30', 30], ['16:30', '20:30', 20], ['20:30', '26:00', 40]]
    }
  ]
};
