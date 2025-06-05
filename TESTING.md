# Testing Guide - Order Allocation System Frontend

## Overview
The frontend application includes comprehensive testing infrastructure even before the backend is ready. We use Mock Service Worker (MSW) to simulate API responses, allowing full testing and development of the UI.

## Testing Stack
- **Vitest**: Fast unit test runner with excellent Vite integration
- **React Testing Library**: Testing utilities for React components
- **MSW (Mock Service Worker)**: API mocking for realistic testing
- **@testing-library/user-event**: Simulating user interactions

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm test

# Run tests with UI
npm test:ui

# Run tests with coverage
npm test:coverage

# Run tests once (CI mode)
npm test -- --run
```

## Mock API Setup

The application includes a complete mock API server that simulates all backend endpoints:

### Mock Data Available (For Tests Only)
1. **Authentication**
   - Username: `testuser`
   - Password: `password123`
   - Returns JWT tokens

### Real Backend Credentials (Development)
When running with the actual backend:
- Username: `demo_user`
- Password: `demo_password`
- API Base URL: `http://localhost:5000/v1`
- Swagger Docs: `http://localhost:5000/docs`

2. **Securities**
   - US Treasury Note (CUSIP: 912828C58)
   - IBM Corp Bond (CUSIP: 459200HU8)
   - Microsoft Corp Bond (CUSIP: 594918BP8)

3. **Portfolio Groups**
   - Large Cap Growth (5 accounts)
   - Fixed Income (3 accounts)

4. **Allocation Preview**
   - Simulates allocation calculations
   - Returns mock allocation results with metrics

## Testing the Application Manually

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Login Flow
- Navigate to http://localhost:5173
- You'll be redirected to the login page
- Use credentials: `testuser` / `password123`
- After login, you'll be redirected to the Allocation Workbench

### 3. Order Entry (Step 1)
- Search for securities by typing at least 3 characters
- Try searching: "IBM", "MSFT", "treasury"
- Select a security to see its details
- Fill in quantity (minimum 1,000)
- Choose Buy/Sell
- Settlement date defaults to T+2

### 4. Allocation Method (Step 2)
- Currently showing placeholder
- Will include portfolio group selection
- Allocation method choice (Pro-Rata, Custom Weights, Min Dispersion)

### 5. Preview & Commit (Step 3)
- Currently showing placeholder
- Will show AG-Grid with allocation details
- Dispersion metrics visualization

## Test Coverage

Current test coverage includes:

### ✅ Completed Tests
1. **Login Component**
   - Form validation
   - Successful login flow
   - Error handling for invalid credentials
   - Token storage in localStorage

2. **SecuritySearch Component**
   - Autocomplete functionality
   - Debounced search (300ms)
   - Minimum character requirement (3)
   - Security selection callback
   - Error state display

3. **Mock API Handlers**
   - All API endpoints mocked
   - Realistic response delays
   - Error scenarios

### 🔲 Pending Tests
1. **OrderEntry Component**
   - Form validation
   - Number formatting
   - Date picker functionality

2. **AllocationWorkbench**
   - Step navigation
   - State persistence between steps

3. **Integration Tests**
   - Complete allocation flow
   - Error recovery scenarios

## Development Without Backend

The MSW setup allows you to:
1. Develop all UI features independently
2. Test edge cases and error scenarios
3. Demo the application without backend dependencies
4. Ensure consistent behavior during development

## Debugging Tests

1. **View test UI**: Run `npm test:ui` for an interactive test explorer
2. **Debug in VS Code**: Use the Vitest extension for debugging
3. **Console logs**: Tests output to terminal during `npm test`

## Known Issues

1. **Test Warnings**: Some MUI components show prop spreading warnings - these are benign
2. **Async State**: Some tests may need increased timeouts for async operations

## Next Steps

When the backend is ready:
1. Update environment variables to point to real API
2. MSW can be disabled in production builds
3. Keep MSW for development/testing environments
4. Add E2E tests with Cypress for full integration testing