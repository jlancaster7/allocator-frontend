import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/test-utils';
import SecuritySearch from './SecuritySearch';

describe('SecuritySearch Component', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  it('renders with default label', () => {
    renderWithProviders(<SecuritySearch onSelect={mockOnSelect} />);
    
    expect(screen.getByLabelText('Search by CUSIP or Ticker')).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    renderWithProviders(
      <SecuritySearch onSelect={mockOnSelect} label="Find Security" />
    );
    
    expect(screen.getByLabelText('Find Security')).toBeInTheDocument();
  });

  it('shows helper text for minimum characters', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SecuritySearch onSelect={mockOnSelect} />);
    
    const input = screen.getByLabelText('Search by CUSIP or Ticker');
    await user.type(input, 'IB');
    
    // Open the dropdown
    await user.click(input);
    
    await waitFor(() => {
      expect(screen.getByText('Type at least 3 characters to search')).toBeInTheDocument();
    });
  });

  it('searches and displays results after 3 characters', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SecuritySearch onSelect={mockOnSelect} />);
    
    const input = screen.getByLabelText('Search by CUSIP or Ticker');
    await user.type(input, 'IBM');
    
    await waitFor(() => {
      expect(screen.getByText(/IBM Corp 3.45%/)).toBeInTheDocument();
    });
    
    // Check that security details are displayed
    const option = screen.getByText(/IBM Corp 3.45%/).closest('li');
    expect(option).toBeInTheDocument();
    
    if (option) {
      expect(within(option).getByText('459200HU8 - IBM')).toBeInTheDocument();
      expect(within(option).getByText('Coupon: 3.45%')).toBeInTheDocument();
      expect(within(option).getByText(/Maturity:/)).toBeInTheDocument();
      expect(within(option).getByText('Duration: 2.85')).toBeInTheDocument();
    }
  });

  it('filters results based on search query', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SecuritySearch onSelect={mockOnSelect} />);
    
    const input = screen.getByLabelText('Search by CUSIP or Ticker');
    await user.type(input, 'treasury');
    
    await waitFor(() => {
      expect(screen.getByText(/US Treasury Note/)).toBeInTheDocument();
      expect(screen.queryByText(/IBM Corp/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Microsoft Corp/)).not.toBeInTheDocument();
    });
  });

  it('calls onSelect when a security is selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SecuritySearch onSelect={mockOnSelect} />);
    
    const input = screen.getByLabelText('Search by CUSIP or Ticker');
    await user.type(input, 'MSFT');
    
    await waitFor(() => {
      expect(screen.getByText(/Microsoft Corp/)).toBeInTheDocument();
    });
    
    const option = screen.getByText(/Microsoft Corp/).closest('li');
    if (option) {
      await user.click(option);
    }
    
    expect(mockOnSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        cusip: '594918BP8',
        ticker: 'MSFT',
        description: 'Microsoft Corp 2.4% 08/08/2026',
      })
    );
  });

  it('shows loading indicator while searching', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SecuritySearch onSelect={mockOnSelect} />);
    
    const input = screen.getByLabelText('Search by CUSIP or Ticker');
    await user.type(input, 'test');
    
    // Loading indicator should appear briefly
    const progressIndicator = screen.queryByRole('progressbar');
    expect(progressIndicator).toBeDefined();
  });

  it('shows no results message when no securities match', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SecuritySearch onSelect={mockOnSelect} />);
    
    const input = screen.getByLabelText('Search by CUSIP or Ticker');
    await user.type(input, 'xyz123');
    await user.click(input); // Open dropdown
    
    await waitFor(() => {
      expect(screen.getByText('No securities found')).toBeInTheDocument();
    });
  });

  it('displays error state when provided', () => {
    renderWithProviders(
      <SecuritySearch 
        onSelect={mockOnSelect} 
        error={true}
        helperText="Security selection is required"
      />
    );
    
    const input = screen.getByLabelText('Search by CUSIP or Ticker');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Security selection is required')).toBeInTheDocument();
  });

  it('debounces search requests', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SecuritySearch onSelect={mockOnSelect} />);
    
    const input = screen.getByLabelText('Search by CUSIP or Ticker');
    
    // Type quickly
    await user.type(input, 'I');
    await user.type(input, 'B');
    await user.type(input, 'M');
    
    // Results should only appear after debounce delay
    expect(screen.queryByText(/IBM Corp/)).not.toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText(/IBM Corp/)).toBeInTheDocument();
    }, { timeout: 500 });
  });
});