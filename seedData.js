const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Category = require('./models/Category');
const Event = require('./models/Event');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eventmanagement', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Event.deleteMany({});
    console.log('Cleared existing data');

    // Create categories
    const categories = [
      {
        name: 'Music & Concerts',
        slug: 'music-concerts',
        description: 'Live music performances, concerts, and musical events',
        color: '#FF6B6B',
        icon: '🎵',
        isActive: true,
        sortOrder: 1
      },
      {
        name: 'Sports & Fitness',
        slug: 'sports-fitness',
        description: 'Sports events, fitness classes, and athletic competitions',
        color: '#4ECDC4',
        icon: '⚽',
        isActive: true,
        sortOrder: 2
      },
      {
        name: 'Technology',
        slug: 'technology',
        description: 'Tech conferences, workshops, and innovation events',
        color: '#45B7D1',
        icon: '💻',
        isActive: true,
        sortOrder: 3
      },
      {
        name: 'Business & Networking',
        slug: 'business-networking',
        description: 'Business conferences, networking events, and professional meetups',
        color: '#96CEB4',
        icon: '💼',
        isActive: true,
        sortOrder: 4
      },
      {
        name: 'Education & Learning',
        slug: 'education-learning',
        description: 'Educational workshops, seminars, and learning events',
        color: '#FFEAA7',
        icon: '📚',
        isActive: true,
        sortOrder: 5
      },
      {
        name: 'Arts & Culture',
        slug: 'arts-culture',
        description: 'Art exhibitions, cultural events, and creative workshops',
        color: '#DDA0DD',
        icon: '🎨',
        isActive: true,
        sortOrder: 6
      },
      {
        name: 'Food & Drink',
        slug: 'food-drink',
        description: 'Food festivals, wine tastings, and culinary events',
        color: '#FFB347',
        icon: '🍷',
        isActive: true,
        sortOrder: 7
      },
      {
        name: 'Health & Wellness',
        slug: 'health-wellness',
        description: 'Health seminars, wellness retreats, and medical conferences',
        color: '#98D8C8',
        icon: '🧘',
        isActive: true,
        sortOrder: 8
      }
    ];

    const createdCategories = await Category.insertMany(categories);
    console.log('Created categories:', createdCategories.length);

    // Create users
    const users = [
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        isVerified: true
      },
      {
        name: 'Event Organizer',
        email: 'organizer@example.com',
        password: 'organizer123',
        role: 'organizer',
        isVerified: true
      },
      {
        name: 'John Doe',
        email: 'user@example.com',
        password: 'user123',
        role: 'user',
        isVerified: true
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'user123',
        role: 'user',
        isVerified: true
      },
      {
        name: 'Tech Conference Organizer',
        email: 'tech@example.com',
        password: 'organizer123',
        role: 'organizer',
        isVerified: true
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log('Created users:', createdUsers.length);

    // Create sample events
    const events = [
      {
        title: 'Summer Music Festival 2024',
        description: 'Join us for the biggest music festival of the year! Featuring top artists from around the world, amazing food vendors, and unforgettable experiences. This three-day event will showcase various genres including rock, pop, electronic, and indie music.',
        shortDescription: 'Three-day music festival featuring top artists from around the world',
        organizer: createdUsers[1]._id, // Event Organizer
        category: createdCategories[0]._id, // Music & Concerts
        tags: ['music', 'festival', 'summer', 'live music'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
            alt: 'Music Festival Stage',
            isPrimary: true
          }
        ],
        venue: {
          name: 'Central Park',
          address: {
            street: '123 Park Avenue',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
          },
          capacity: 10000,
          amenities: ['Parking', 'Food Court', 'Restrooms', 'First Aid']
        },
        dateTime: {
          start: new Date('2024-07-15T18:00:00Z'),
          end: new Date('2024-07-17T23:00:00Z'),
          timezone: 'America/New_York'
        },
        pricing: {
          isFree: false,
          currency: 'USD',
          tiers: [
            {
              name: 'General Admission',
              price: 150,
              description: 'Access to all stages and general areas',
              quantity: 8000,
              sold: 1200
            },
            {
              name: 'VIP',
              price: 350,
              description: 'VIP area access, premium food, and meet & greet',
              quantity: 2000,
              sold: 300
            }
          ]
        },
        capacity: {
          total: 10000,
          available: 8500,
          sold: 1500
        },
        status: 'published',
        visibility: 'public',
        featured: true,
        featuredUntil: new Date('2024-08-15T00:00:00Z'),
        analytics: {
          views: 2500,
          shares: 150,
          likes: 300,
          bookmarks: 200
        }
      },
      {
        title: 'Tech Innovation Summit 2024',
        description: 'The premier technology conference bringing together industry leaders, innovators, and entrepreneurs. Discover the latest trends in AI, blockchain, cloud computing, and more. Network with like-minded professionals and gain insights from keynote speakers.',
        shortDescription: 'Premier technology conference with industry leaders and innovators',
        organizer: createdUsers[4]._id, // Tech Conference Organizer
        category: createdCategories[2]._id, // Technology
        tags: ['technology', 'innovation', 'AI', 'blockchain', 'networking'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
            alt: 'Tech Conference',
            isPrimary: true
          }
        ],
        venue: {
          name: 'Convention Center',
          address: {
            street: '456 Tech Boulevard',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94105',
            country: 'USA'
          },
          capacity: 2000,
          amenities: ['WiFi', 'Parking', 'Catering', 'AV Equipment']
        },
        dateTime: {
          start: new Date('2024-06-20T09:00:00Z'),
          end: new Date('2024-06-22T17:00:00Z'),
          timezone: 'America/Los_Angeles'
        },
        pricing: {
          isFree: false,
          currency: 'USD',
          tiers: [
            {
              name: 'Early Bird',
              price: 299,
              description: 'Early bird pricing for early registrants',
              quantity: 500,
              sold: 450
            },
            {
              name: 'Regular',
              price: 399,
              description: 'Standard conference access',
              quantity: 1000,
              sold: 600
            },
            {
              name: 'Student',
              price: 199,
              description: 'Discounted rate for students with valid ID',
              quantity: 500,
              sold: 200
            }
          ]
        },
        capacity: {
          total: 2000,
          available: 750,
          sold: 1250
        },
        status: 'published',
        visibility: 'public',
        featured: true,
        featuredUntil: new Date('2024-07-20T00:00:00Z'),
        analytics: {
          views: 3200,
          shares: 280,
          likes: 450,
          bookmarks: 320
        }
      },
      {
        title: 'Yoga & Wellness Retreat',
        description: 'Escape the hustle and bustle of daily life with our rejuvenating yoga and wellness retreat. Experience daily yoga sessions, meditation workshops, healthy meals, and spa treatments in a serene mountain setting.',
        shortDescription: 'Rejuvenating yoga and wellness retreat in a serene mountain setting',
        organizer: createdUsers[1]._id, // Event Organizer
        category: createdCategories[7]._id, // Health & Wellness
        tags: ['yoga', 'wellness', 'retreat', 'meditation', 'spa'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
            alt: 'Yoga Retreat',
            isPrimary: true
          }
        ],
        venue: {
          name: 'Mountain View Resort',
          address: {
            street: '789 Mountain Road',
            city: 'Aspen',
            state: 'CO',
            zipCode: '81611',
            country: 'USA'
          },
          capacity: 50,
          amenities: ['Spa', 'Restaurant', 'Hiking Trails', 'Meditation Room']
        },
        dateTime: {
          start: new Date('2024-08-10T08:00:00Z'),
          end: new Date('2024-08-12T18:00:00Z'),
          timezone: 'America/Denver'
        },
        pricing: {
          isFree: false,
          currency: 'USD',
          tiers: [
            {
              name: 'Single Room',
              price: 899,
              description: 'Private room with all meals and activities included',
              quantity: 20,
              sold: 8
            },
            {
              name: 'Shared Room',
              price: 699,
              description: 'Shared room with all meals and activities included',
              quantity: 30,
              sold: 15
            }
          ]
        },
        capacity: {
          total: 50,
          available: 27,
          sold: 23
        },
        status: 'published',
        visibility: 'public',
        featured: false,
        analytics: {
          views: 850,
          shares: 45,
          likes: 120,
          bookmarks: 80
        }
      },
      {
        title: 'Food & Wine Tasting Experience',
        description: 'Indulge in an exquisite culinary journey featuring local and international wines paired with gourmet dishes. Meet renowned chefs and sommeliers while enjoying live cooking demonstrations and wine education sessions.',
        shortDescription: 'Exquisite culinary journey with wine pairings and chef demonstrations',
        organizer: createdUsers[1]._id, // Event Organizer
        category: createdCategories[6]._id, // Food & Drink
        tags: ['food', 'wine', 'tasting', 'culinary', 'chef'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
            alt: 'Wine Tasting',
            isPrimary: true
          }
        ],
        venue: {
          name: 'Grand Hotel Ballroom',
          address: {
            street: '321 Luxury Lane',
            city: 'Napa Valley',
            state: 'CA',
            zipCode: '94558',
            country: 'USA'
          },
          capacity: 200,
          amenities: ['Valet Parking', 'Coat Check', 'Live Music', 'Gift Shop']
        },
        dateTime: {
          start: new Date('2024-09-15T19:00:00Z'),
          end: new Date('2024-09-15T23:00:00Z'),
          timezone: 'America/Los_Angeles'
        },
        pricing: {
          isFree: false,
          currency: 'USD',
          tiers: [
            {
              name: 'Standard',
              price: 125,
              description: 'Wine tasting and appetizers',
              quantity: 150,
              sold: 45
            },
            {
              name: 'Premium',
              price: 200,
              description: 'Full dinner, premium wines, and chef meet & greet',
              quantity: 50,
              sold: 20
            }
          ]
        },
        capacity: {
          total: 200,
          available: 135,
          sold: 65
        },
        status: 'published',
        visibility: 'public',
        featured: false,
        analytics: {
          views: 1200,
          shares: 80,
          likes: 180,
          bookmarks: 95
        }
      },
      {
        title: 'Startup Pitch Competition',
        description: 'Watch innovative startups pitch their ideas to a panel of expert judges and investors. Network with entrepreneurs, investors, and industry professionals. Winners receive funding and mentorship opportunities.',
        shortDescription: 'Innovative startup pitch competition with funding opportunities',
        organizer: createdUsers[4]._id, // Tech Conference Organizer
        category: createdCategories[3]._id, // Business & Networking
        tags: ['startup', 'pitch', 'investment', 'entrepreneurship', 'networking'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800',
            alt: 'Startup Pitch',
            isPrimary: true
          }
        ],
        venue: {
          name: 'Innovation Hub',
          address: {
            street: '555 Startup Street',
            city: 'Austin',
            state: 'TX',
            zipCode: '78701',
            country: 'USA'
          },
          capacity: 300,
          amenities: ['WiFi', 'Parking', 'Coffee Bar', 'Networking Lounge']
        },
        dateTime: {
          start: new Date('2024-10-05T13:00:00Z'),
          end: new Date('2024-10-05T18:00:00Z'),
          timezone: 'America/Chicago'
        },
        pricing: {
          isFree: true,
          currency: 'USD',
          tiers: [
            {
              name: 'Free Admission',
              price: 0,
              description: 'Free admission to watch pitches and network',
              quantity: 300,
              sold: 150
            }
          ]
        },
        capacity: {
          total: 300,
          available: 150,
          sold: 150
        },
        status: 'published',
        visibility: 'public',
        featured: false,
        analytics: {
          views: 1800,
          shares: 120,
          likes: 250,
          bookmarks: 140
        }
      }
    ];

    const createdEvents = await Event.insertMany(events);
    console.log('Created events:', createdEvents.length);

    // Update category event counts
    for (const category of createdCategories) {
      const eventCount = await Event.countDocuments({ category: category._id });
      await Category.findByIdAndUpdate(category._id, { eventCount });
    }

    console.log('✅ Seed data created successfully!');
    console.log('\n📊 Summary:');
    console.log(`- ${createdUsers.length} users created`);
    console.log(`- ${createdCategories.length} categories created`);
    console.log(`- ${createdEvents.length} events created`);
    console.log('\n🔑 Demo Accounts:');
    console.log('Admin: admin@example.com / admin123');
    console.log('Organizer: organizer@example.com / organizer123');
    console.log('User: user@example.com / user123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
});
