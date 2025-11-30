import { VehicleDef } from './types';

export const CITIES = ['Leh', 'Kargil', 'Srinagar', 'Jammu', 'Nubra', 'Pangong'];

export const DESTINATION_IMAGES: Record<string, string> = {
  'Leh': 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?q=80&w=600&auto=format&fit=crop',
  'Srinagar': 'https://images.unsplash.com/photo-1566837945700-30057527ade0?q=80&w=600&auto=format&fit=crop',
  'Jammu': 'https://images.unsplash.com/photo-1595846519845-68e298c2edd8?q=80&w=600&auto=format&fit=crop',
  'Kargil': 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=600&auto=format&fit=crop',
  'Nubra': 'https://images.unsplash.com/photo-1562907550-096d3bf9b25c?q=80&w=600&auto=format&fit=crop',
  'Pangong': 'https://images.unsplash.com/photo-1615817342656-7492c7302f23?q=80&w=600&auto=format&fit=crop',
  'default': 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=600&auto=format&fit=crop'
};

// Using generic reliable placeholder images for vehicles
export const VEHICLES: VehicleDef[] = [
  { 
    type: 'Mahindra Xylo', 
    rateMultiplier: 1.0, 
    seats: 7, 
    layout: [1, 3, 3], 
    image: 'https://imgd.aeplcdn.com/1056x594/cw/ec/26659/Mahindra-Xylo-Exterior-121541.jpg?wm=0' 
  }, 
  { 
    type: 'Toyota Innova', 
    rateMultiplier: 1.2, 
    seats: 7, 
    layout: [1, 3, 3],
    image: 'https://imgd.aeplcdn.com/1056x594/n/cw/ec/114977/innova-crysta-exterior-right-front-three-quarter-2.jpeg?isig=0&q=80'
  },
  { 
    type: 'Innova Crysta', 
    rateMultiplier: 1.4, 
    seats: 6, 
    layout: [1, 2, 3], // Captain seats in middle
    image: 'https://imgd.aeplcdn.com/1056x594/n/cw/ec/140809/innova-crysta-exterior-right-front-three-quarter.jpeg?isig=0&q=80'
  },
  { 
    type: 'Tempo Traveler', 
    rateMultiplier: 1.5, 
    seats: 12, 
    layout: [1, 2, 3, 3, 3],
    image: 'https://5.imimg.com/data5/SELLER/Default/2022/9/MQ/FO/DA/3642735/force-tempo-traveller-302-2600-wb-12-d-bus-500x500.png'
  },
];

export const BASE_RATES: Record<string, number> = {
  'Leh-Srinagar': 2500,
  'Leh-Jammu': 3500,
  'Leh-Kargil': 1200,
  'Kargil-Srinagar': 1500,
  'Kargil-Jammu': 2800,
  'Leh-Nubra': 1000,
  'Leh-Pangong': 1500,
};

export const MOCK_DRIVERS = [
  { name: 'Tenzin Norbu', vehicleNo: 'JK-10-B-1234', type: 'Innova Crysta', rating: 4.8 },
  { name: 'Stanzin Dorje', vehicleNo: 'JK-10-A-5678', type: 'Xylo', rating: 4.5 },
  { name: 'Rahul Sharma', vehicleNo: 'JK-02-C-9988', type: 'Innova', rating: 4.6 },
];