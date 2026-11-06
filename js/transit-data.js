/*
 * Jebel Ali & Discovery Gardens Transit Guide - schedule data
 * -----------------------------------------------------------
 * IMPORTANT: This is ILLUSTRATIVE sample data (headway-based), modelled on the
 * kind of service pattern these corridors run. It is NOT an official RTA feed.
 * Always confirm against RTA / S'hail / Dubai Drive before relying on a time.
 *
 * To edit: change `windows` (service windows + headway in minutes) or the
 * `stops` offsets (minutes from the route's first stop). Times can run past
 * midnight using 24h+ notation, e.g. "26:00" = 02:00 next day.
 *
 * Bump DATA_VERSION and the VERSION in sw.js together when you change this.
 */
window.TRANSIT_DATA = {
  DATA_VERSION: '2026.11.1',

  // type: metro | bus.  shelter: ac | covered | open  (used for badges)
  stops: [
    { id: 'DG_METRO',  name: 'Discovery Gardens / Life Pharmacy Metro', short: 'DG Metro',        type: 'metro', shelter: 'ac' },
    { id: 'DG_HUB',    name: 'Discovery Gardens Bus Hub',               short: 'DG Bus Hub',      type: 'bus',   shelter: 'covered' },
    { id: 'IBN',       name: 'Ibn Battuta Metro',                       short: 'Ibn Battuta',     type: 'metro', shelter: 'ac' },
    { id: 'ENERGY',    name: 'Energy Metro',                            short: 'Energy',          type: 'metro', shelter: 'ac' },
    { id: 'UAEX',      name: 'UAE Exchange Metro',                      short: 'UAE Exchange',    type: 'metro', shelter: 'ac' },
    { id: 'DMCC',      name: 'DMCC Metro',                              short: 'DMCC',            type: 'metro', shelter: 'ac' },
    { id: 'JAFZA_N',   name: 'JAFZA North Gate',                        short: 'JAFZA North',     type: 'bus',   shelter: 'covered' },
    { id: 'JAFZA_S',   name: 'JAFZA South Gate',                        short: 'JAFZA South',     type: 'bus',   shelter: 'covered' },
    { id: 'JAFZA_HUB', name: 'JAFZA Bus Hub',                           short: 'JAFZA Hub',       type: 'bus',   shelter: 'ac' },
    { id: 'JA_IND1',   name: 'Jebel Ali Industrial Area 1',             short: 'Industrial 1',    type: 'bus',   shelter: 'open' },
    { id: 'JA_IND2',   name: 'Jebel Ali Industrial Area 2',             short: 'Industrial 2',    type: 'bus',   shelter: 'open' },
    { id: 'JA_IND3',   name: 'Jebel Ali Industrial Area 3',             short: 'Industrial 3',    type: 'bus',   shelter: 'open' }
  ],

  // Shift windows in minutes from midnight (end may exceed 1440).
  shifts: {
    now:     { label: 'Next buses', range: null },
    morning: { label: 'Morning 05:00-08:30', short: 'Morning', range: [300, 510] },
    evening: { label: 'Evening 16:30-20:30', short: 'Evening', range: [990, 1230] },
    night:   { label: 'Night 21:00-02:00',   short: 'Night',   range: [1260, 1560] }
  },

  areas: {
    all:        'All zones',
    north:      'JAFZA North',
    south:      'JAFZA South',
    industrial: 'Industrial 1-3'
  },

  // stops: [stopId, minutes from first stop] in the OUTBOUND (to JAFZA) direction.
  // Inbound runs the same stops in reverse and leaves `inShift` minutes later.
  routes: [
    {
      id: 'F43', color: '#e4572e', areas: ['north'], inShift: 6,
      note: 'Feeder via Ibn Battuta to JAFZA North and Industrial 1',
      stops: [['DG_METRO', 0], ['DG_HUB', 5], ['IBN', 13], ['JAFZA_N', 29], ['JA_IND1', 38]],
      windows: [['05:00', '08:30', 12], ['08:30', '16:30', 20], ['16:30', '20:30', 12], ['20:30', '24:00', 30]]
    },
    {
      id: 'F44', color: '#2a9d8f', areas: ['south'], inShift: 8,
      note: 'Feeder via Ibn Battuta and Energy to JAFZA South and Industrial 2',
      stops: [['DG_METRO', 0], ['IBN', 9], ['ENERGY', 17], ['JAFZA_S', 32], ['JA_IND2', 41]],
      windows: [['05:15', '08:45', 15], ['08:45', '16:30', 25], ['16:30', '20:45', 15], ['20:45', '25:00', 35]]
    },
    {
      id: 'F46', color: '#7b2cbf', areas: ['industrial'], inShift: 5,
      note: 'Express-style shift service to JAFZA Hub and Industrial 3',
      stops: [['DG_METRO', 0], ['UAEX', 10], ['JAFZA_HUB', 26], ['JA_IND3', 36]],
      windows: [['04:50', '08:30', 10], ['08:30', '16:30', 30], ['16:30', '21:00', 10], ['21:00', '23:30', 30]]
    },
    {
      id: 'F54', color: '#f4a100', areas: ['north', 'industrial'], inShift: 7,
      note: 'DMCC to JAFZA North via Ibn Battuta and Discovery Gardens',
      stops: [['DMCC', 0], ['IBN', 11], ['DG_METRO', 22], ['JAFZA_N', 38], ['JA_IND1', 47]],
      windows: [['05:30', '08:30', 20], ['08:30', '16:30', 40], ['16:30', '20:30', 20], ['20:30', '22:30', 45]]
    },
    {
      id: '99', color: '#0077b6', areas: ['south', 'industrial'], inShift: 10,
      note: 'Metro link: Ibn Battuta - Energy - UAE Exchange - JAFZA South - Industrial 2/3',
      stops: [['IBN', 0], ['DG_METRO', 8], ['ENERGY', 16], ['UAEX', 24], ['JAFZA_S', 36], ['JA_IND2', 44], ['JA_IND3', 52]],
      windows: [['05:00', '08:30', 18], ['08:30', '16:30', 30], ['16:30', '20:30', 18], ['20:30', '25:30', 30]]
    },
    {
      id: '91', color: '#c1121f', areas: ['north', 'south', 'industrial'], inShift: 9,
      note: 'Late-night service: DMCC - Energy - Discovery Gardens - JAFZA Hub - Industrial 1/2/3',
      stops: [['DMCC', 0], ['ENERGY', 14], ['DG_METRO', 25], ['JAFZA_HUB', 41], ['JA_IND1', 49], ['JA_IND2', 55], ['JA_IND3', 61]],
      windows: [['05:00', '08:30', 20], ['08:30', '16:30', 30], ['16:30', '20:30', 20], ['20:30', '26:00', 40]]
    }
  ]
};
