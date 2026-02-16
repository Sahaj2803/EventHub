export interface Event {
  _id: string;
  title: string;
  description: string;
  shortDescription?: string;
  organizer: {
    _id: string;
    name: string;
    avatar?: string;
    email?: string;
    phone?: string;
  };
  category: {
    _id: string;
    name: string;
    slug: string;
    color: string;
    description?: string;
  };
  tags: string[];
  images: Array<{
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
  venue: {
    name: string;
    address: {
      street?: string;
      city: string;
      state?: string;
      zipCode?: string;
      country: string;
    };
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    capacity?: number;
    amenities?: string[];
  };
  dateTime: {
    start: string;
    end: string;
    timezone: string;
  };
  pricing: {
    isFree: boolean;
    currency: string;
    tiers: Array<{
      name: string;
      price: number;
      description?: string;
      quantity?: number;
      sold: number;
    }>;
  };
  capacity: {
    total?: number;
    available?: number;
    sold: number;
  };
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  visibility: 'public' | 'private' | 'unlisted';
  requirements?: {
    ageRestriction?: number;
    dressCode?: string;
    itemsToBring?: string[];
    restrictions?: string[];
  };
  socialLinks?: {
    website?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  analytics: {
    views: number;
    shares: number;
    likes: number;
    bookmarks: number;
  };
  featured: boolean;
  featuredUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventData {
  title: string;
  description: string;
  shortDescription?: string;
  category: string;
  tags?: string[];
  images?: Array<{
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
  venue: {
    name: string;
    address: {
      street?: string;
      city: string;
      state?: string;
      zipCode?: string;
      country: string;
    };
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    capacity?: number;
    amenities?: string[];
  };
  dateTime: {
    start: string;
    end: string;
    timezone?: string;
  };
  pricing: {
    isFree: boolean;
    currency?: string;
    tiers: Array<{
      name: string;
      price: number;
      description?: string;
      quantity?: number;
    }>;
  };
  capacity?: {
    total?: number;
  };
  visibility?: 'public' | 'private' | 'unlisted';
  requirements?: {
    ageRestriction?: number;
    dressCode?: string;
    itemsToBring?: string[];
    restrictions?: string[];
  };
  socialLinks?: {
    website?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

export interface EventFilters {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  featured?: boolean;
  upcoming?: boolean;
  location?: string;
  organizer?: string;
}
