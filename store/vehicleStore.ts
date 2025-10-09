import { create } from 'zustand';

export interface Vehicle {
  id: string;
  name: string;
  type: string;
  batteryLevel: number;
  pricePerHour: number;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  image: string;
  isAvailable: boolean;
  range: number;
  features: string[];
}

export interface Rental {
  id: string;
  vehicleId: string;
  vehicle: Vehicle;
  startDate: string;
  endDate?: string;
  pickupLocation: string;
  returnLocation?: string;
  totalCost: number;
  distance: number;
  status: 'active' | 'completed' | 'cancelled';
}

interface VehicleState {
  vehicles: Vehicle[];
  currentRental: Rental | null;
  rentalHistory: Rental[];
  selectedVehicle: Vehicle | null;
  setSelectedVehicle: (vehicle: Vehicle | null) => void;
  bookVehicle: (vehicleId: string, pickupTime: Date) => Promise<void>;
  completeRental: (rentalId: string, returnData: any) => Promise<void>;
  loadMockData: () => void;
}

const mockVehicles: Vehicle[] = [
  {
    id: '1',
    name: 'VinFast VF5',
    type: 'Hatchback',
    batteryLevel: 95,
    pricePerHour: 50000,
    location: {
      lat: 10.762622,
      lng: 106.660172,
      address: '123 Nguyễn Huệ, Quận 1, TP.HCM'
    },
    image: 'https://images.pexels.com/photos/35967/mini-cooper-auto-model-vehicle.jpg?auto=compress&cs=tinysrgb&w=400',
    isAvailable: true,
    range: 285,
    features: ['GPS', 'Điều hòa', 'Bluetooth', 'USB']
  },
  {
    id: '2',
    name: 'Tesla Model 3',
    type: 'Sedan',
    batteryLevel: 78,
    pricePerHour: 75000,
    location: {
      lat: 10.776889,
      lng: 106.695374,
      address: '456 Lê Lợi, Quận 3, TP.HCM'
    },
    image: 'https://images.pexels.com/photos/788600/pexels-photo-788600.jpeg?auto=compress&cs=tinysrgb&w=400',
    isAvailable: true,
    range: 420,
    features: ['Autopilot', 'Supercharging', 'Premium Audio']
  },
  {
    id: '3',
    name: 'BYD Tang',
    type: 'SUV',
    batteryLevel: 88,
    pricePerHour: 65000,
    location: {
      lat: 10.754700,
      lng: 106.662265,
      address: '789 Võ Văn Tần, Quận 3, TP.HCM'
    },
    image: 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=400',
    isAvailable: true,
    range: 505,
    features: ['AWD', 'Panoramic Roof', 'Wireless Charging']
  }
];

const mockRentalHistory: Rental[] = [
  {
    id: 'r1',
    vehicleId: '1',
    vehicle: mockVehicles[0],
    startDate: '2024-01-15T08:00:00Z',
    endDate: '2024-01-15T17:30:00Z',
    pickupLocation: '123 Nguyễn Huệ, Quận 1',
    returnLocation: '456 Lê Lợi, Quận 3',
    totalCost: 475000,
    distance: 45,
    status: 'completed'
  },
  {
    id: 'r2',
    vehicleId: '2',
    vehicle: mockVehicles[1],
    startDate: '2024-01-10T14:00:00Z',
    endDate: '2024-01-10T18:00:00Z',
    pickupLocation: '456 Lê Lợi, Quận 3',
    returnLocation: '789 Võ Văn Tần, Quận 3',
    totalCost: 300000,
    distance: 28,
    status: 'completed'
  }
];

export const useVehicleStore = create<VehicleState>((set, get) => ({
  vehicles: [],
  currentRental: null,
  rentalHistory: [],
  selectedVehicle: null,

  setSelectedVehicle: (vehicle) => {
    set({ selectedVehicle: vehicle });
  },

  bookVehicle: async (vehicleId: string, pickupTime: Date) => {
    const vehicle = get().vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    // Mock booking process
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newRental: Rental = {
      id: Date.now().toString(),
      vehicleId,
      vehicle,
      startDate: pickupTime.toISOString(),
      pickupLocation: vehicle.location.address,
      totalCost: 0,
      distance: 0,
      status: 'active'
    };

    set({ currentRental: newRental });
  },

  completeRental: async (rentalId: string, returnData: any) => {
    const currentRental = get().currentRental;
    if (!currentRental || currentRental.id !== rentalId) return;

    await new Promise(resolve => setTimeout(resolve, 1000));

    const completedRental: Rental = {
      ...currentRental,
      endDate: new Date().toISOString(),
      returnLocation: returnData.location,
      totalCost: returnData.totalCost,
      distance: returnData.distance,
      status: 'completed'
    };

    set({
      currentRental: null,
      rentalHistory: [completedRental, ...get().rentalHistory]
    });
  },

  loadMockData: () => {
    set({
      vehicles: mockVehicles,
      rentalHistory: mockRentalHistory
    });
  }
}));