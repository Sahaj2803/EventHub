export interface Booking {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  event: {
    _id: string;
    title: string;
    dateTime: {
      start: string;
      end: string;
    };
    venue: {
      name: string;
      address: {
        street?: string;
        city: string;
        state?: string;
        zipCode?: string;
        country: string;
      };
    };
    images: Array<{
      url: string;
      alt: string;
      isPrimary: boolean;
    }>;
    organizer?: {
      _id: string;
      name: string;
    };
  };
  tickets: Array<{
    tier: {
      name: string;
      price: number;
    };
    quantity: number;
    totalPrice: number;
  }>;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'stripe' | 'paypal' | 'bank_transfer' | 'cash' | 'wallet';
  paymentIntentId?: string;
  transactionId?: string;
  bookingReference: string;
  attendeeInfo: {
    name: string;
    email: string;
    phone?: string;
    specialRequirements?: string;
  };
  qrCode?: string;
  checkInStatus: 'not_checked_in' | 'checked_in' | 'no_show';
  checkInTime?: string;
  refundRequest?: {
    requested: boolean;
    reason?: string;
    requestedAt?: string;
    processedAt?: string;
    amount?: number;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingData {
  eventId: string;
  tickets: Array<{
    tier: string;
    quantity: number;
  }>;
  attendeeInfo: {
    name: string;
    email: string;
    phone?: string;
    specialRequirements?: string;
  };
  paymentMethod?: 'stripe' | 'paypal' | 'bank_transfer' | 'cash' | 'wallet';
}

export interface BookingFilters {
  page?: number;
  limit?: number;
  status?: string;
}
