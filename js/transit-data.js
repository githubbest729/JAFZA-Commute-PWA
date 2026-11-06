/*
 * Jebel Ali & Discovery Gardens Transit Guide - Schedule & Route Data (v1.2.0 - 2026 Update)
 * Updated with verified RTA corridors, precise Metro exit walking times, and official Nol fare structures.
 */
window.TRANSIT_DATA = {
  DATA_VERSION: '2026.11.2',

  stops: [
    { id: 'DG_METRO',  name: 'Discovery Gardens / Life Pharmacy Metro', short: 'DG Metro', type: 'metro', shelter: 'ac', walk: 'Exit 1 (Gardens side) • 2 min walk to feeder bay' },
    { id: 'GARDENS_M', name: 'The Gardens Metro Station', short: 'The Gardens Metro', type: 'metro', shelter: 'ac', walk: 'Exit 1 (Gardens Blvd) • 2 min walk' },
    { id: 'ALFURJAN_M',name: 'Al Furjan Metro Station', short: 'Al Furjan Metro', type: 'metro', shelter: 'ac', walk: 'Exit 2 (Bus interchange) • 2 min walk' },
    { id: 'DG_HUB',    name: 'Discovery Gardens Central Bus Hub (St. 1)', short: 'DG Bus Hub', type: 'bus', shelter: 'covered' },
    { id: 'DG_13_16',  name: 'Discovery Gardens Buildings 13-16', short: 'DG St. 13-16', type: 'bus', shelter: 'covered' },
    { id: 'IBN',       name: 'Ibn Battuta Metro & Bus Station', short: 'Ibn Battuta', type: 'metro', shelter: 'ac', walk: 'Covered pedestrian bridge • Bay 2, 3, 5 & 6 (3 min walk)' },
    { id: 'ENERGY',    name: 'Energy Metro Station', short: 'Energy Metro', type: 'metro', shelter: 'ac', walk: 'Landside exit • 3 min walk to feeder bay' },
    { id: 'FEST_PLZ',  name: 'Festival Plaza / Muntazah Complex', short: 'Festival Plaza', type: 'bus', shelter: 'covered' },
    { id: 'JA_GARDENS',name: 'Jebel Ali Gardens Village', short: 'JA Gardens', type: 'bus', shelter: 'covered' },
    { id: 'DANUBE_M',  name: 'Danube Metro Station', short: 'Danube Metro', type: 'metro', shelter: 'ac', walk: 'Seaside exit • Direct escalator to F54 terminal' },
    { id: 'UAEX',      name: 'UAE Exchange Metro Station', short: 'UAE Exchange', type: 'metro', shelter: 'ac', walk: 'Ground concourse • Direct transfer to JAFZA South' },
    { id: 'DMCC',      name: 'DMCC Metro Station', short: 'DMCC Metro', type: 'metro', shelter: 'ac', walk: 'Exit 1 (Landside) • 3 min walk' },
    { id: 'DIP_METRO', name: 'DIP Metro Station (Dubai Investment Park)', short: 'DIP Metro', type: 'metro', shelter: 'ac', walk: 'Exit 1 • 2 min walk to bus bay' },
    { id: 'DUNES_VIL', name: 'DIP Dunes Village / AMB Area', short: 'Dunes Village', type: 'bus', shelter: 'covered' },
    { id: 'JAFZA_N',   name: 'JAFZA North Gate & Roundabout 5', short: 'JAFZA North', type: 'bus', shelter: 'covered' },
    { id: 'JAFZA_S',   name: 'JAFZA South Accommodations & R/A 12', short: 'JAFZA South', type: 'bus', shelter: 'covered' },
    { id: 'JAFZA_HUB', name: 'JAFZA Main Central Bus Hub', short: 'JAFZA Hub', type: 'bus', shelter: 'ac' },
    { id: 'JA_IND1',   name: 'Jebel Ali Industrial Area 1 (West)', short: 'Industrial 1', type: 'bus', shelter: 'open' },
    { id: 'JA_IND2',   name: 'Jebel Ali Industrial Area 2 (Central)', short: 'Industrial 2', type: 'bus', shelter: 'open' },
    { id: 'JA_IND3',   name: 'Jebel Ali Industrial Area 3 (East Gate)', short: 'Industrial 3', type: 'bus', shelter: 'open' }
  ],

  shifts: {
    now:     { label: 'Next buses', range: null },
    morning: { label: 'Morning 05:00-08:30', short: 'Morning', range: [285, 525] },
    evening: { label: 'Evening 16:30-20:30', short: 'Evening', range: [975, 1245] },
    night:   { label: 'Night 21:00-02:00',   short: 'Night',   range: [1245, 1575] }
  },

  areas: {
    all:        'All zones',
    north:      'JAFZA North',
    south:      'JAFZA South',
    industrial: 'Industrial 1-3'
  },

  routes: [
    {
      id: 'F43', fare: '1 Zone • AED 3.00', color: '#f37021', areas: ['north'], inShift: 6,
      note: 'Ibn Battuta Bay 6 ⇄ Discovery Gardens ⇄ The Gardens Metro ⇄ Al Furjan Metro',
      fareDetail: 'Free transfer with Dubai Metro within 30 mins',
      stops: [['IBN', 0], ['DG_METRO', 8], ['DG_HUB', 14], ['GARDENS_M', 20], ['ALFURJAN_M', 28], ['JAFZA_N', 38], ['JA_IND1', 46]],
      windows: [['05:00', '08:30', 12], ['08:30', '16:30', 18], ['16:30', '20:30', 12], ['20:30', '24:00', 25]]
    },
    {
      id: 'F44', fare: '1 Zone • AED 3.00', color: '#00a896', areas: ['south'], inShift: 8,
      note: 'Energy Metro ⇄ Festival Plaza / Muntazah ⇄ JA Gardens ⇄ Ibn Battuta',
      fareDetail: 'Free transfer with Dubai Metro within 30 mins',
      stops: [['ENERGY', 0], ['FEST_PLZ', 7], ['JA_GARDENS', 15], ['IBN', 24], ['JAFZA_S', 36], ['JA_IND2', 45]],
      windows: [['05:15', '08:45', 15], ['08:45', '16:30', 20], ['16:30', '20:45', 15], ['20:45', '25:00', 30]]
    },
    {
      id: 'F46', fare: '1 Zone • AED 3.00', color: '#8a2be2', areas: ['industrial'], inShift: 5,
      note: 'Ibn Battuta ⇄ Discovery Gardens 13-16 ⇄ DIP Metro ⇄ Dunes Village & JAFZA Hub',
      fareDetail: 'Free transfer with Dubai Metro within 30 mins',
      stops: [['IBN', 0], ['DG_METRO', 9], ['DG_13_16', 16], ['DIP_METRO', 25], ['DUNES_VIL', 33], ['JAFZA_HUB', 44], ['JA_IND3', 53]],
      windows: [['04:50', '08:30', 12], ['08:30', '16:30', 25], ['16:30', '21:00', 12], ['21:00', '24:00', 25]]
    },
    {
      id: 'F54', fare: '1-2 Zones • AED 3.00-5.00', color: '#f7931e', areas: ['north', 'south', 'industrial'], inShift: 7,
      note: 'Danube Metro Seaside ⇄ JAFZA Roundabouts ⇄ UAE Exchange Metro ⇄ JAFZA South',
      fareDetail: 'Direct industrial feeder connecting Red Line to all sectors',
      stops: [['DANUBE_M', 0], ['JAFZA_N', 12], ['JAFZA_HUB', 22], ['UAEX', 32], ['JAFZA_S', 42], ['JA_IND1', 50]],
      windows: [['05:15', '08:45', 15], ['08:45', '16:30', 25], ['16:30', '20:45', 15], ['20:45', '23:30', 35]]
    },
    {
      id: '99', fare: '2 Zones • AED 5.00', color: '#0077b6', areas: ['south', 'industrial'], inShift: 10,
      note: 'Metro Trunk: Ibn Battuta - Energy - UAE Exchange - JAFZA South - Industrial 2/3',
      fareDetail: 'Standard Silver Nol: AED 5.00 • Gold: AED 10.00',
      stops: [['IBN', 0], ['DG_METRO', 8], ['ENERGY', 16], ['UAEX', 26], ['JAFZA_S', 38], ['JA_IND2', 46], ['JA_IND3', 54]],
      windows: [['05:00', '08:30', 15], ['08:30', '16:30', 25], ['16:30', '20:30', 15], ['20:30', '25:30', 30]]
    },
    {
      id: '91', fare: '2 Zones • AED 5.00', color: '#e63946', areas: ['north', 'south', 'industrial'], inShift: 9,
      note: 'Late & Shift Trunk: DMCC - Energy - Discovery Gardens - JAFZA Hub - Industrial 1/2/3',
      fareDetail: 'Standard Silver Nol: AED 5.00 • 24/7 Red Line feeder link',
      stops: [['DMCC', 0], ['ENERGY', 14], ['DG_METRO', 24], ['JAFZA_HUB', 39], ['JA_IND1', 48], ['JA_IND2', 55], ['JA_IND3', 62]],
      windows: [['05:00', '08:30', 18], ['08:30', '16:30', 25], ['16:30', '20:30', 18], ['20:30', '26:00', 30]]
    }
  ]
};
