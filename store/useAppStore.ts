import { create } from 'zustand';
import { AppState, User, Vehicle, Rental, RentalStation } from '@/types';

// Mock data
const mockVehicles: Vehicle[] = [
  {
    id: '1',
    name: 'VinFast VF e34',
    type: 'scooter',
    brand: 'VinFast',
    model: 'VF e34',
    batteryLevel: 85,
    pricePerHour: 25000,
    pricePerDay: 350000,
    location: {
      latitude: 21.0285,
      longitude: 105.8542,
      address: 'Hàng Bài, Hoàn Kiếm, Hà Nội'
    },
    image: 'https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg',
    isAvailable: true,
    features: ['GPS', 'Bluetooth', 'Fast Charging']
  },
  {
    id: '2',
    name: 'YADEA G5',
    type: 'scooter',
    brand: 'YADEA',
    model: 'G5',
    batteryLevel: 92,
    pricePerHour: 20000,
    pricePerDay: 280000,
    location: {
      latitude: 21.0245,
      longitude: 105.8412,
      address: 'Tràng Tiền, Hoàn Kiếm, Hà Nội'
    },
    image: 'https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg',
    isAvailable: true,
    features: ['LED Light', 'USB Charging', 'Anti-theft']
  },
  {
    id: '3',
    name: 'VinFast VF 8',
    type: 'car',
    brand: 'VinFast',
    model: 'VF 8',
    batteryLevel: 78,
    pricePerHour: 150000,
    pricePerDay: 2500000,
    location: {
      latitude: 21.0195,
      longitude: 105.8456,
      address: 'Lý Thái Tổ, Hoàn Kiếm, Hà Nội'
    },
    image: 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg',
    isAvailable: true,
    features: ['Autopilot', '5 Seats', 'Premium Sound', 'Climate Control']
  }
];

const mockStations: RentalStation[] = [
  {
    id: '1',
    name: 'Hoàn Kiếm Station',
    location: {
      latitude: 21.0285,
      longitude: 105.8542,
      address: 'Hàng Bài, Hoàn Kiếm, Hà Nội'
    },
    availableVehicles: 12,
    operatingHours: {
      open: '06:00',
      close: '22:00'
    }
  },
  {
    id: '2',
    name: 'Tràng Tiền Station',
    location: {
      latitude: 21.0245,
      longitude: 105.8412,
      address: 'Tràng Tiền, Hoàn Kiếm, Hà Nội'
    },
    availableVehicles: 8,
    operatingHours: {
      open: '05:30',
      close: '23:00'
    }
  }
];

const mockRentals: Rental[] = [
  {
    id: '1',
    vehicleId: '1',
    vehicle: mockVehicles[0],
    startTime: new Date('2024-01-15T08:30:00'),
    endTime: new Date('2024-01-15T17:45:00'),
    startLocation: {
      latitude: 21.0285,
      longitude: 105.8542,
      address: 'Hàng Bài, Hoàn Kiếm, Hà Nội'
    },
    endLocation: {
      latitude: 21.0245,
      longitude: 105.8412,
      address: 'Tràng Tiền, Hoàn Kiếm, Hà Nội'
    },
    totalCost: 180000,
    distance: 45.2,
    status: 'completed'
  },
  {
    id: '2',
    vehicleId: '2',
    vehicle: mockVehicles[1],
    startTime: new Date('2024-01-20T14:15:00'),
    endTime: new Date('2024-01-20T18:30:00'),
    startLocation: {
      latitude: 21.0245,
      longitude: 105.8412,
      address: 'Tràng Tiền, Hoàn Kiếm, Hà Nội'
    },
    endLocation: {
      latitude: 21.0195,
      longitude: 105.8456,
      address: 'Lý Thái Tổ, Hoàn Kiếm, Hà Nội'
    },
    totalCost: 95000,
    distance: 23.8,
    status: 'completed'
  }
];

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  theme: 'light',
  currentRental: null,
  rentals: mockRentals,
  vehicles: mockVehicles,
  stations: mockStations,

  login: async (email: string, password: string) => {
    // Mock login - always succeed
    await new Promise(resolve => setTimeout(resolve, 1000));
    const mockUser: User = {
      id: '1',
      name: 'Nguyễn Văn An',
      email: email,
      phone: '+84 987654321',
      licenseNumber: 'B2-123456789',
      isVerified: true,
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg'
    };
    set({ user: mockUser, isAuthenticated: true });
    return true;
  },

  register: async (userData: Partial<User>) => {
    // Mock registration
    await new Promise(resolve => setTimeout(resolve, 1500));
    const mockUser: User = {
      id: Date.now().toString(),
      name: userData.name || '',
      email: userData.email || '',
      phone: userData.phone || '',
      licenseNumber: userData.licenseNumber || '',
      isVerified: false
    };
    set({ user: mockUser, isAuthenticated: true });
    return true;
  },

  logout: () => {
    set({ user: null, isAuthenticated: false, currentRental: null });
  },

  toggleTheme: () => {
    set(state => ({ theme: state.theme === 'light' ? 'dark' : 'light' }));
  },

  bookVehicle: async (vehicleId: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return true;
  },

  startRental: (vehicleId: string) => {
    const vehicle = get().vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      const rental: Rental = {
        id: Date.now().toString(),
        vehicleId,
        vehicle,
        startTime: new Date(),
        startLocation: vehicle.location,
        totalCost: 0,
        distance: 0,
        status: 'active'
      };
      set({ currentRental: rental });
    }
  },

  endRental: (damages?: string[], additionalCharges?: number) => {
    const state = get();
    if (state.currentRental) {
      const endTime = new Date();
      const duration = (endTime.getTime() - state.currentRental.startTime.getTime()) / (1000 * 60 * 60);
      const baseCost = Math.ceil(duration) * state.currentRental.vehicle.pricePerHour;
      
      const completedRental: Rental = {
        ...state.currentRental,
        endTime,
        totalCost: baseCost + (additionalCharges || 0),
        damages,
        additionalCharges,
        status: 'completed',
        distance: Math.random() * 50 + 5 // Mock distance
      };

      set({
        currentRental: null,
        rentals: [completedRental, ...state.rentals]
      });
    }
  },

  updateUser: (userData: Partial<User>) => {
    set(state => ({
      user: state.user ? { ...state.user, ...userData } : null
    }));
  }
}));