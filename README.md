# Order Allocation System Frontend

A React-based frontend application for managing order allocations in financial portfolios.

## Features

- **Authentication**: JWT-based authentication with automatic token refresh
- **Security Search**: Real-time security search with autocomplete functionality
- **Order Entry**: Intuitive order entry form with validation
- **Allocation Methods**: Support for Pro-Rata, Custom Weights, and Minimum Dispersion allocation strategies
- **Allocation Preview**: Interactive preview with AG-Grid for detailed allocation analysis
- **Dispersion Metrics**: Visual representation of allocation metrics using Recharts

## Tech Stack

- **React 18** with TypeScript
- **Material-UI v5** for component library
- **Redux Toolkit** with RTK Query for state management
- **AG-Grid** for data tables
- **Recharts** for data visualization
- **React Hook Form** with Yup for form validation
- **Vite** for build tooling
- **Vitest** for testing

## Prerequisites

- Node.js 18+ 
- npm or yarn

## Installation

```bash
# Clone the repository
git clone https://github.com/jlancaster7/allocator-frontend.git
cd allocator-frontend

# Install dependencies
npm install
```

## Environment Setup

Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000/v1

# AG-Grid License (optional for enterprise features)
VITE_AG_GRID_LICENSE_KEY=your_license_key_here
```

## Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Type check
npm run type-check
```

## Project Structure

```
src/
├── api/                  # API interceptors and base configuration
├── components/           # Reusable UI components
│   ├── allocation/      # Allocation-specific components
│   ├── common/          # Shared components
│   └── layout/          # Layout components
├── features/            # Redux slices and API endpoints
│   ├── allocation/      # Allocation state and API
│   └── auth/           # Authentication state and API
├── hooks/              # Custom React hooks
├── mocks/              # MSW mock handlers for testing
├── pages/              # Page components
├── store/              # Redux store configuration
├── styles/             # Theme and global styles
├── test/               # Test utilities
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Key Components

### Authentication Flow
- Login with email/password
- Automatic token refresh using refresh tokens
- Protected routes with automatic redirect to login

### Order Entry Process
1. **Security Search**: Search and select securities by CUSIP or ticker
2. **Order Details**: Specify side (buy/sell), quantity, settlement date, and optional price
3. **Allocation Method**: Choose allocation strategy and configure parameters
4. **Preview & Commit**: Review allocation details and commit to backend

### Allocation Methods
- **Pro-Rata**: Allocate based on account NAV proportions
- **Custom Weights**: Enhanced mode with multiple allocation types
  - Dollar amounts (e.g., allocate $2M to an account)
  - Percentages (e.g., allocate 25% to an account)
  - Quantities (e.g., allocate 500,000 bonds to an account)
  - Mix different types in a single allocation
  - Smart remainder distribution options
- **Minimum Dispersion**: Optimize to minimize active spread duration dispersion

## Testing

The project uses Vitest with React Testing Library for unit testing:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## API Integration

The frontend expects a backend API following the contract defined in `api-schema-contract.txt`. Key endpoints:

- `POST /auth/login` - User authentication
- `POST /auth/refresh` - Token refresh
- `GET /portfolio-groups` - Fetch portfolio groups
- `GET /securities/search` - Search securities
- `POST /allocations/preview` - Preview allocation
- `POST /allocations/commit` - Commit allocation

## Deployment

Build the production bundle:

```bash
npm run build
```

The built files will be in the `dist/` directory, ready to be served by any static file server.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary and confidential.