export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  isVerified: boolean;
  avatar?: string;
}

export interface Vehicle {
  id: string;
  name: string;
  type: 'bike' | 'scooter' | 'car';
  brand: string;
  model: string;
  batteryLevel: number;
  pricePerHour: number;
  pricePerDay: number;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  image: string;
  isAvailable: boolean;
  features: string[];
}

export interface Rental {
  id: string;
  vehicleId: string;
  vehicle: Vehicle;
  startTime: Date;
  endTime?: Date;
  startLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  endLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  totalCost: number;
  distance: number;
  status: 'active' | 'completed' | 'cancelled';
  damages?: string[];
  additionalCharges?: number;
}

export interface RentalStation {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  availableVehicles: number;
  operatingHours: {
    open: string;
    close: string;
  };
}

export type ThemeMode = 'light' | 'dark';

export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  theme: ThemeMode;
  currentRental: Rental | null;
  rentals: Rental[];
  vehicles: Vehicle[];
  stations: RentalStation[];
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Partial<User>) => Promise<boolean>;
  logout: () => void;
  toggleTheme: () => void;
  bookVehicle: (vehicleId: string) => Promise<boolean>;
  startRental: (vehicleId: string) => void;
  endRental: (damages?: string[], additionalCharges?: number) => void;
  updateUser: (userData: Partial<User>) => void;
}