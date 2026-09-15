import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import {
  FerryProvider,
  useFerry,
  validateBookingRequest,
  BookingValidationParams,
} from './FerryContext';
import { Trip, Route, Passenger, VehicleInfo } from '../types';

describe('FerryContext & FerryProvider Critical Path Test Suite', () => {
  const sampleRoutes: Route[] = [
    {
      id: 'route-gateway-mandwa',
      name: 'Gateway Terminal ⇄ Riverfront (Mandwa)',
      originPortId: 'port-gateway',
      destinationPortId: 'port-riverfront',
      intermediateStops: [],
      distanceKm: 19.4,
      estimatedDurationMin: 45,
      operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      baseFareInr: 180,
      vehicleFareInr: 850,
      status: 'active',
      waypoints: [],
    },
    {
      id: 'route-gateway-island',
      name: 'Gateway Terminal ⇄ Island Terminal (Elephanta)',
      originPortId: 'port-gateway',
      destinationPortId: 'port-island',
      intermediateStops: [],
      distanceKm: 11.2,
      estimatedDurationMin: 35,
      operatingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      baseFareInr: 140,
      vehicleFareInr: 0, // No vehicles allowed
      status: 'active',
      waypoints: [],
    },
  ];

  const sampleTrips: Trip[] = [
    {
      id: 'trip-test-1',
      tripNumber: 'FF-901',
      routeId: 'route-gateway-mandwa',
      ferryId: 'ferry-101',
      originPortId: 'port-gateway',
      destinationPortId: 'port-riverfront',
      captainId: 'capt-1',
      captainName: 'Capt. R. Deshmukh',
      scheduledDeparture: '10:00',
      scheduledArrival: '10:45',
      estimatedArrival: '10:45',
      delayMinutes: 0,
      status: 'boarding',
      passengerCapacity: 10,
      bookedPassengers: 7, // 3 remaining seats
      boardedPassengers: 2,
      vehicleCapacity: 2,
      bookedVehicles: 1, // 1 remaining vehicle spot
      gateNumber: 'Gate-1',
      progressPercent: 0,
      remainingDistanceKm: 19.4,
    },
    {
      id: 'trip-test-full',
      tripNumber: 'FF-902',
      routeId: 'route-gateway-mandwa',
      ferryId: 'ferry-102',
      originPortId: 'port-riverfront',
      destinationPortId: 'port-gateway',
      captainId: 'capt-2',
      captainName: 'Capt. S. Patil',
      scheduledDeparture: '11:00',
      scheduledArrival: '11:45',
      estimatedArrival: '11:45',
      delayMinutes: 0,
      status: 'scheduled',
      passengerCapacity: 5,
      bookedPassengers: 5, // 0 seats remaining
      boardedPassengers: 0,
      vehicleCapacity: 1,
      bookedVehicles: 1, // 0 vehicle spots remaining
      gateNumber: 'Gate-2',
      progressPercent: 0,
      remainingDistanceKm: 19.4,
    },
    {
      id: 'trip-test-arrived',
      tripNumber: 'FF-903',
      routeId: 'route-gateway-mandwa',
      ferryId: 'ferry-103',
      originPortId: 'port-gateway',
      destinationPortId: 'port-riverfront',
      captainId: 'capt-3',
      captainName: 'Capt. M. Naik',
      scheduledDeparture: '08:00',
      scheduledArrival: '08:45',
      estimatedArrival: '08:45',
      delayMinutes: 0,
      status: 'arrived',
      passengerCapacity: 50,
      bookedPassengers: 40,
      boardedPassengers: 40,
      vehicleCapacity: 10,
      bookedVehicles: 5,
      gateNumber: 'Gate-3',
      progressPercent: 100,
      remainingDistanceKm: 0,
    },
  ];

  describe('1. Booking Validation Unit Tests', () => {
    it('should validate a valid passenger booking successfully', () => {
      const validParams: BookingValidationParams = {
        tripId: 'trip-test-1',
        routeId: 'route-gateway-mandwa',
        passengers: [
          {
            id: 'p-1',
            fullName: 'Aarav Patel',
            category: 'Adult',
            gender: 'Male',
            age: 29,
            email: 'aarav@example.com',
            mobile: '+91 98200 11223',
            idType: 'Aadhaar',
            idNumber: 'XXXX-XXXX-1234',
            emergencyContact: { name: 'Diya Patel', phone: '+91 98200 11224', relation: 'Spouse' },
          },
          {
            id: 'p-2',
            fullName: 'Diya Patel',
            category: 'Adult',
            gender: 'Female',
            age: 28,
            email: 'diya@example.com',
            mobile: '+91 98200 11224',
            idType: 'Aadhaar',
            idNumber: 'XXXX-XXXX-1235',
            emergencyContact: { name: 'Aarav Patel', phone: '+91 98200 11223', relation: 'Spouse' },
          },
        ],
      };

      const result = validateBookingRequest(validParams, sampleTrips, sampleRoutes);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.remainingSeats).toBe(3);
    });

    it('should reject booking when passengers array is empty', () => {
      const emptyParams: BookingValidationParams = {
        tripId: 'trip-test-1',
        routeId: 'route-gateway-mandwa',
        passengers: [],
      };

      const result = validateBookingRequest(emptyParams, sampleTrips, sampleRoutes);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one passenger must be specified.');
    });

    it('should reject booking when passenger full name is missing', () => {
      const invalidPassenger: BookingValidationParams = {
        tripId: 'trip-test-1',
        routeId: 'route-gateway-mandwa',
        passengers: [
          {
            id: 'p-1',
            fullName: '   ',
            category: 'Adult',
            gender: 'Male',
            age: 30,
            email: '',
            mobile: '',
            idType: 'Aadhaar',
            idNumber: '',
            emergencyContact: { name: '', phone: '', relation: '' },
          },
        ],
      };

      const result = validateBookingRequest(invalidPassenger, sampleTrips, sampleRoutes);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Passenger #1 full name is required.');
    });

    it('should reject booking if requested passengers exceed trip remaining capacity', () => {
      const makePassenger = (id: string, name: string): Passenger => ({
        id,
        fullName: name,
        category: 'Adult',
        gender: 'Male',
        age: 32,
        email: 'test@example.com',
        mobile: '+91 90000 00000',
        idType: 'Aadhaar',
        idNumber: 'XXXX',
        emergencyContact: { name: 'Contact', phone: '+91 90000 00001', relation: 'Family' },
      });

      const overbookingParams: BookingValidationParams = {
        tripId: 'trip-test-1',
        routeId: 'route-gateway-mandwa',
        passengers: [
          makePassenger('p-1', 'Passenger 1'),
          makePassenger('p-2', 'Passenger 2'),
          makePassenger('p-3', 'Passenger 3'),
          makePassenger('p-4', 'Passenger 4'),
        ],
      };

      const result = validateBookingRequest(overbookingParams, sampleTrips, sampleRoutes);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('Insufficient seats available'))).toBe(true);
    });

    it('should reject vehicle booking if vessel/route does not support vehicle carriage', () => {
      const vehicleBookingOnPassengerRoute: BookingValidationParams = {
        tripId: 'trip-test-1',
        routeId: 'route-gateway-island', // vehicleFareInr is 0
        passengers: [
          {
            id: 'p-1',
            fullName: 'Rohan Sharma',
            category: 'Adult',
            gender: 'Male',
            age: 26,
            email: 'rohan@example.com',
            mobile: '+91 99999 11111',
            idType: 'Driving License',
            idNumber: 'DL-1234',
            emergencyContact: { name: 'Priya', phone: '+91 99999 11112', relation: 'Sister' },
          },
        ],
        vehicle: {
          type: 'Hatchback / Sedan',
          registrationNumber: 'MH-01-AB-1234',
          driverName: 'Rohan Sharma',
        },
      };

      const result = validateBookingRequest(vehicleBookingOnPassengerRoute, sampleTrips, sampleRoutes);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('does not support vehicle roll-on'))).toBe(true);
    });

    it('should reject vehicle booking if vehicle deck is full', () => {
      const vehicleDeckFullParams: BookingValidationParams = {
        tripId: 'trip-test-full', // bookedVehicles === vehicleCapacity
        routeId: 'route-gateway-mandwa',
        passengers: [
          {
            id: 'p-1',
            fullName: 'Sameer Sen',
            category: 'Adult',
            gender: 'Male',
            age: 40,
            email: 'sameer@example.com',
            mobile: '+91 98888 22222',
            idType: 'Passport',
            idNumber: 'P-1234567',
            emergencyContact: { name: 'Asha', phone: '+91 98888 22223', relation: 'Wife' },
          },
        ],
        vehicle: {
          type: 'SUV / MUV',
          registrationNumber: 'MH-02-XY-9999',
          driverName: 'Sameer Sen',
        },
      };

      const result = validateBookingRequest(vehicleDeckFullParams, sampleTrips, sampleRoutes);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('Vehicle deck is fully booked'))).toBe(true);
    });

    it('should reject booking on a trip that is already arrived or cancelled', () => {
      const completedTripParams: BookingValidationParams = {
        tripId: 'trip-test-arrived',
        routeId: 'route-gateway-mandwa',
        passengers: [
          {
            id: 'p-1',
            fullName: 'Kavita Rao',
            category: 'Adult',
            gender: 'Female',
            age: 35,
            email: 'kavita@example.com',
            mobile: '+91 97777 33333',
            idType: 'Aadhaar',
            idNumber: 'XXXX',
            emergencyContact: { name: 'Sunil', phone: '+91 97777 33334', relation: 'Brother' },
          },
        ],
      };

      const result = validateBookingRequest(completedTripParams, sampleTrips, sampleRoutes);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('cannot accept new bookings'))).toBe(true);
    });
  });

  describe('2. FerryProvider State Updates & Lifecycle Integration Tests', () => {
    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <FerryProvider>{children}</FerryProvider>
    );

    it('should properly initialize the maritime provider with initial state', () => {
      const { result } = renderHook(() => useFerry(), { wrapper });

      expect(result.current.isInitialized).toBe(true);
      expect(result.current.ferries.length).toBeGreaterThan(0);
      expect(result.current.routes.length).toBeGreaterThan(0);
      expect(result.current.ports.length).toBeGreaterThan(0);
      expect(result.current.trips.length).toBeGreaterThan(0);
    });

    it('should handle createBooking: validate input, decrement capacity, and store booking', () => {
      const { result } = renderHook(() => useFerry(), { wrapper });

      const targetTrip = result.current.trips.find(
        (t) => t.status === 'scheduled' || t.status === 'boarding'
      );
      expect(targetTrip).toBeDefined();
      const initialBookedPassengers = targetTrip!.bookedPassengers;

      const newPassenger: Passenger = {
        id: `p-${Date.now()}`,
        fullName: 'Vikram Merchant',
        category: 'Adult',
        gender: 'Male',
        age: 38,
        email: 'vikram.merchant@mumbaiferry.gov.in',
        mobile: '+91 98200 44556',
        idType: 'Aadhaar',
        idNumber: 'XXXX-9876',
        emergencyContact: { name: 'Meera Merchant', phone: '+91 98200 44557', relation: 'Spouse' },
      };

      let createdBooking: any;
      act(() => {
        createdBooking = result.current.createBooking({
          tripId: targetTrip!.id,
          routeId: targetTrip!.routeId,
          passengers: [newPassenger],
          totalFareInr: 180,
          paymentMethod: 'UPI',
          bookedByEmail: 'vikram.merchant@mumbaiferry.gov.in',
        });
      });

      expect(createdBooking).toBeDefined();
      expect(createdBooking.bookingStatus).toBe('confirmed');
      expect(createdBooking.paymentStatus).toBe('paid');
      expect(createdBooking.passengers[0].fullName).toBe('Vikram Merchant');
      expect(createdBooking.qrPayload).toContain('FERRYFLOW|TICKET|');

      const updatedTrip = result.current.trips.find((t) => t.id === targetTrip!.id);
      expect(updatedTrip!.bookedPassengers).toBe(initialBookedPassengers + 1);

      expect(result.current.bookings.some((b) => b.id === createdBooking.id)).toBe(true);
    });

    it('should handle cancelBooking: update status to cancelled and restore trip seats', () => {
      const { result } = renderHook(() => useFerry(), { wrapper });

      const targetTrip = result.current.trips[0];
      const initialBookedPassengers = targetTrip.bookedPassengers;

      let createdBooking: any;
      act(() => {
        createdBooking = result.current.createBooking({
          tripId: targetTrip.id,
          routeId: targetTrip.routeId,
          passengers: [
            {
              id: 'p-c1',
              fullName: 'Ananya Roy',
              category: 'Adult',
              gender: 'Female',
              age: 27,
              email: 'ananya.roy@example.com',
              mobile: '+91 98111 22334',
              idType: 'Aadhaar',
              idNumber: 'XXXX-1122',
              emergencyContact: { name: 'Roy Parent', phone: '+91 98111 22335', relation: 'Parent' },
            },
          ],
          totalFareInr: 180,
          paymentMethod: 'Credit/Debit Card',
          bookedByEmail: 'ananya.roy@example.com',
        });
      });

      const passengersAfterBooking = result.current.trips.find((t) => t.id === targetTrip.id)!.bookedPassengers;
      expect(passengersAfterBooking).toBe(initialBookedPassengers + 1);

      act(() => {
        result.current.cancelBooking(createdBooking.id);
      });

      const cancelled = result.current.bookings.find((b) => b.id === createdBooking.id);
      expect(cancelled?.bookingStatus).toBe('cancelled');
      expect(cancelled?.paymentStatus).toBe('refunded');

      const tripAfterCancel = result.current.trips.find((t) => t.id === targetTrip.id);
      expect(tripAfterCancel!.bookedPassengers).toBe(initialBookedPassengers);
    });

    it('should throw an error when createBooking is called with invalid parameters', () => {
      const { result } = renderHook(() => useFerry(), { wrapper });

      expect(() => {
        act(() => {
          result.current.createBooking({
            tripId: 'non-existent-trip',
            routeId: 'route-1',
            passengers: [],
            totalFareInr: 0,
            paymentMethod: 'Counter Cash',
            bookedByEmail: 'invalid@test.com',
          });
        });
      }).toThrow(/Booking validation failed/);
    });

    it('should handle scanTicket validation state updates', () => {
      const { result } = renderHook(() => useFerry(), { wrapper });

      const invalidScan = result.current.scanTicket('INVALID|QR|CODE');
      expect(invalidScan.status).toBe('INVALID');

      let booking: any;
      act(() => {
        booking = result.current.createBooking({
          tripId: result.current.trips[0].id,
          routeId: result.current.trips[0].routeId,
          passengers: [
            {
              id: 'p-valid',
              fullName: 'Rajesh Kumar',
              category: 'Adult',
              gender: 'Male',
              age: 44,
              email: 'rajesh@example.com',
              mobile: '+91 97654 32100',
              idType: 'Aadhaar',
              idNumber: 'XXXX-5544',
              emergencyContact: { name: 'Sunita Kumar', phone: '+91 97654 32101', relation: 'Spouse' },
            },
          ],
          totalFareInr: 180,
          paymentMethod: 'UPI',
          bookedByEmail: 'rajesh@example.com',
        });
      });

      const validScan = result.current.scanTicket(booking.qrPayload);
      expect(validScan.status).toBe('VALID');
      expect(validScan.booking?.bookingRef).toBe(booking.bookingRef);
    });

    it('should handle updateTripStatus and updateTripGate state updates', () => {
      const { result } = renderHook(() => useFerry(), { wrapper });
      const testTripId = result.current.trips[0].id;

      act(() => {
        result.current.updateTripStatus(testTripId, 'delayed', 15);
      });

      let updatedTrip = result.current.trips.find((t) => t.id === testTripId);
      expect(updatedTrip?.status).toBe('delayed');
      expect(updatedTrip?.delayMinutes).toBe(15);

      act(() => {
        result.current.updateTripGate(testTripId, 'Gate-5B', 'Gate Closed');
      });

      updatedTrip = result.current.trips.find((t) => t.id === testTripId);
      expect(updatedTrip?.gateNumber).toBe('Gate-5B');
      expect(updatedTrip?.gateStatus).toBe('Gate Closed');
    });

    it('should handle publishAlert and dismissAlert state updates', () => {
      const { result } = renderHook(() => useFerry(), { wrapper });

      act(() => {
        result.current.publishAlert({
          title: 'Monsoon High Swell Advisory',
          message: 'Swell heights reaching 2.5m at Prongs Reef approach channel.',
          category: 'Weather Warning',
          severity: 'high',
          affectedRouteId: 'route-1',
          validUntil: 'Today 22:00',
          channels: ['Web', 'Push'],
        });
      });

      const publishedAlert = result.current.alerts.find(
        (a) => a.title === 'Monsoon High Swell Advisory'
      );
      expect(publishedAlert).toBeDefined();
      expect(publishedAlert?.active).toBe(true);

      act(() => {
        result.current.dismissAlert(publishedAlert!.id);
      });

      const dismissedAlert = result.current.alerts.find((a) => a.id === publishedAlert!.id);
      expect(dismissedAlert).toBeUndefined();
    });
  });
});
