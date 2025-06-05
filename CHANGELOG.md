# Changelog

All notable changes to the Order Allocation System Frontend will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-01-06

### Added
- **Enhanced Custom Weights Allocation** - Major feature upgrade
  - New allocation types: Dollar Amount, Percentage, and Quantity
  - Mix different allocation types within a single order
  - Remainder distribution options (Pro-Rata, Equal, None)
  - Allow partial allocation when constraints prevent full allocation
  - Enhanced preview showing requested vs. allocated amounts
  - Allocation source tracking (Direct, Remainder, Pro-Rata)
  - Toggle between enhanced and legacy modes for backward compatibility
- New `AllocationTypeSelector` component with intuitive icons
- Comprehensive TypeScript types in `src/types/allocation.ts`
- Smart validation for each allocation type
- Dynamic input formatting with currency/percentage symbols

### Fixed
- React key prop warning in SecuritySearch component
- Order Entry form spacing issues - now more compact
- AG-Grid module registration errors
- AG-Grid theme conflicts and deprecated API usage
- TypeScript compilation errors with Material-UI Grid components

### Changed
- AllocationMethodSelector now supports both legacy and enhanced modes
- AllocationPreview grid displays additional columns for custom weights
- Improved error handling for null/missing account data
- Updated to use modern AG-Grid API (cellSelection, rowSelection object format)

### Backend Integration Notes
- Fixed portfolio groups endpoint to return correct field names (`group_id`, `group_name`)
- Ensured accounts array is never null and contains valid account objects

## [1.0.0] - 2025-01-05

### Added
- Initial release with complete Order Allocation System
- Three-step allocation wizard (Order Entry, Method Selection, Preview & Commit)
- JWT authentication with automatic token refresh
- Security search with debounced autocomplete
- Portfolio group multi-select
- Three allocation methods: Pro-Rata, Custom Weights, Minimum Dispersion
- AG-Grid Enterprise integration for data tables
- Recharts integration for dispersion metrics
- Excel export functionality
- Comprehensive form validation
- Material-UI theming
- Redux Toolkit with RTK Query for state management
- Full TypeScript support
- Test suite with Vitest and React Testing Library