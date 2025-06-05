// Enhanced Custom Weights Types

export type AllocationType = 'DOLLAR_AMOUNT' | 'PERCENTAGE' | 'QUANTITY';
export type RemainderHandling = 'PRO_RATA' | 'EQUAL' | 'NONE';

export interface AllocationSpecification {
  account_id: string;
  type: AllocationType;
  value: number;
  min_value?: number;
  max_value?: number;
  priority?: number;
}

export interface EnhancedCustomWeight extends AllocationSpecification {
  account_name?: string;
  // UI-specific fields
  formattedValue?: string;
  validationError?: string;
}

export interface CustomWeightsParameters {
  // Enhanced format (recommended)
  allocations?: AllocationSpecification[];
  // Legacy format (backward compatible)
  weights?: { [key: string]: number };
  remainder_handling?: RemainderHandling;
  allow_partial?: boolean;
}

export interface AccountAllocationEnhanced {
  account_id: string;
  account_name: string;
  allocated_quantity: number;
  allocated_notional: number;
  // New fields for enhanced custom weights
  requested_type?: AllocationType;
  requested_value?: number;
  allocation_source?: 'DIRECT' | 'REMAINDER' | 'PRO_RATA';
  // Other existing fields
  available_cash: number;
  post_trade_cash: number;
  pre_trade_metrics: {
    active_spread_duration: number;
  };
  post_trade_metrics: {
    active_spread_duration: number;
  };
}

export interface AllocationSummaryEnhanced {
  total_allocated: number;
  allocation_rate: number;
  accounts_allocated: number;
  unallocated: number;
  // New fields
  direct_allocations?: number;
  remainder_allocations?: number;
  allocation_breakdown?: {
    dollar_amount_count: number;
    percentage_count: number;
    quantity_count: number;
    remainder_count: number;
  };
}