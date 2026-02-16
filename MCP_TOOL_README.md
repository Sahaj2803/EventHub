# Event Web MCP Tool

A comprehensive Model Context Protocol (MCP) tool for your Event Web application with TestSprite API integration for automated testing.

## 🚀 Features

### Event Management
- **Get Events**: Browse events with advanced filtering, pagination, and search
- **Event Details**: Get detailed information about specific events
- **Featured Events**: Retrieve featured events
- **Create Events**: Create new events (organizer/admin only)
- **Update Events**: Modify existing events
- **Delete Events**: Remove events

### Booking System
- **User Bookings**: View user's booking history
- **Create Booking**: Book tickets for events
- **Cancel Booking**: Cancel existing bookings
- **QR Code Generation**: Generate QR codes for event check-ins

### User Management
- **User Registration**: Register new users
- **User Login**: Authenticate users and get tokens
- **Profile Management**: View and update user profiles
- **Role-based Access**: Support for user, organizer, and admin roles

### Wallet System
- **Balance Check**: View wallet balance
- **Wallet Recharge**: Add funds to wallet
- **Transaction History**: View wallet transactions
- **Payment Integration**: Support for multiple payment methods

### Category Management
- **Get Categories**: Retrieve all event categories
- **Create Categories**: Add new categories (admin only)

### TestSprite Integration
- **Automated Testing**: Run comprehensive API tests
- **Test Types**: Smoke, regression, performance, and security tests
- **Test Results**: View detailed test results and reports
- **Environment Support**: Test across different environments

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- Event Web application running
- TestSprite API key

## 🛠️ Installation

1. **Install Dependencies**:
   ```bash
   npm install @modelcontextprotocol/sdk axios
   ```

2. **Set Environment Variables**:
   ```bash
   export TESTSPRITE_API_KEY="your-testsprite-api-key-here"
   export EVENT_WEB_API_BASE="http://localhost:5005/api"
   export EVENT_WEB_AUTH_TOKEN="your-auth-token-here"
   ```

3. **Configure MCP Server**:
   Add to your MCP configuration file (usually `~/.cursor/mcp.json`):
   ```json
   {
     "mcpServers": {
       "event-web-tool": {
         "command": "node",
         "args": ["/path/to/your/event-web/mcp-tool.js"],
         "env": {
           "TESTSPRITE_API_KEY": "your-testsprite-api-key-here",
           "EVENT_WEB_API_BASE": "http://localhost:5005/api",
           "EVENT_WEB_AUTH_TOKEN": "your-auth-token-here"
         }
       }
     }
   }
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `TESTSPRITE_API_KEY` | Your TestSprite API key | - | Yes |
| `EVENT_WEB_API_BASE` | Base URL for Event Web API | `http://localhost:5005/api` | No |
| `EVENT_WEB_AUTH_TOKEN` | Authentication token for API calls | - | No |

### TestSprite API Key Setup

1. Sign up for TestSprite account
2. Get your API key from the dashboard
3. Set the `TESTSPRITE_API_KEY` environment variable
4. The tool will automatically use this key for all TestSprite API calls

## 📖 Usage Examples

### 1. Get All Events
```javascript
// Get first page of published events
await mcp.callTool('get_events', {
  page: 1,
  limit: 10,
  status: 'published'
});

// Search events by location
await mcp.callTool('get_events', {
  search: 'conference',
  location: 'New York',
  upcoming: true
});
```

### 2. Create a New Event
```javascript
await mcp.callTool('create_event', {
  title: "Tech Conference 2024",
  description: "Annual technology conference featuring latest innovations",
  category: "64a1b2c3d4e5f6789012345", // Category ID
  dateTime: {
    start: "2024-06-15T09:00:00Z",
    end: "2024-06-15T17:00:00Z",
    timezone: "UTC"
  },
  venue: {
    name: "Convention Center",
    address: {
      city: "San Francisco",
      country: "USA",
      street: "123 Main St"
    }
  },
  pricing: {
    isFree: false,
    currency: "USD",
    tiers: [
      {
        name: "General Admission",
        price: 99.99,
        quantity: 100
      }
    ]
  },
  capacity: {
    total: 100
  }
});
```

### 3. Book an Event
```javascript
await mcp.callTool('create_booking', {
  eventId: "64a1b2c3d4e5f6789012345",
  tickets: [
    {
      tier: "General Admission",
      quantity: 2
    }
  ],
  attendeeInfo: {
    name: "John Doe",
    email: "john@example.com",
    phone: "+1234567890"
  },
  paymentMethod: "wallet"
});
```

### 4. Run TestSprite Tests
```javascript
// Run smoke tests
await mcp.callTool('run_testsprite_test', {
  testType: "smoke",
  environment: "staging"
});

// Run specific endpoint tests
await mcp.callTool('run_testsprite_test', {
  testType: "regression",
  endpoints: ["/events", "/bookings", "/auth/login"],
  environment: "production"
});

// Get test results
await mcp.callTool('get_testsprite_results', {
  testId: "test_12345"
});
```

### 5. User Authentication
```javascript
// Register new user
await mcp.callTool('register_user', {
  name: "Jane Smith",
  email: "jane@example.com",
  password: "securepassword123",
  role: "user"
});

// Login user
const loginResult = await mcp.callTool('login_user', {
  email: "jane@example.com",
  password: "securepassword123"
});

// Use the token from login result for authenticated calls
// Set EVENT_WEB_AUTH_TOKEN environment variable
```

## 🔐 Authentication

The MCP tool supports JWT-based authentication:

1. **Login**: Use `login_user` tool to get authentication token
2. **Set Token**: Set the `EVENT_WEB_AUTH_TOKEN` environment variable
3. **Authenticated Calls**: All protected endpoints will automatically use the token

## 🧪 TestSprite Integration

### Test Types Available

1. **Smoke Tests**: Basic functionality tests
2. **Regression Tests**: Comprehensive API testing
3. **Performance Tests**: Load and stress testing
4. **Security Tests**: Security vulnerability testing

### Running Tests

```javascript
// Basic smoke test
await mcp.callTool('run_testsprite_test', {
  testType: "smoke"
});

// Custom test configuration
await mcp.callTool('run_testsprite_test', {
  testType: "regression",
  endpoints: ["/events", "/bookings", "/users"],
  environment: "staging"
});
```

### Viewing Results

```javascript
// Get latest test results
await mcp.callTool('get_testsprite_results');

// Get specific test results
await mcp.callTool('get_testsprite_results', {
  testId: "test_12345"
});
```

## 🛡️ Error Handling

The tool includes comprehensive error handling:

- **API Errors**: Detailed error messages from Event Web API
- **TestSprite Errors**: Clear error reporting for test failures
- **Validation Errors**: Input validation with helpful error messages
- **Authentication Errors**: Clear feedback for auth issues

## 📊 Monitoring and Logging

- All API calls are logged with timestamps
- TestSprite test results include detailed metrics
- Error tracking and reporting
- Performance monitoring

## 🔄 Updates and Maintenance

To update the MCP tool:

1. Pull latest changes
2. Update dependencies: `npm update`
3. Restart the MCP server
4. Update configuration if needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:

1. Check the documentation
2. Review error logs
3. Test with TestSprite integration
4. Contact the development team

## 🔗 Related Links

- [Event Web Application](../README.md)
- [TestSprite Documentation](https://docs.testsprite.com)
- [MCP Documentation](https://modelcontextprotocol.io)
