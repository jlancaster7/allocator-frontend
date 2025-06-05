import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../../api/interceptors';

// Types based on API schema
export interface Security {
  cusip: string;
  ticker: string;
  description: string;
  coupon: number;
  maturity: string;
  duration: number;
  oas: number;
  min_denomination: number;
}

// NOTE: Backend is not following the API contract!
// Contract specifies: group_id, group_name
// Backend returns: id, name, description, total_nav, strategy
export interface PortfolioGroup {
  // API Contract fields
  group_id: string;
  group_name: string;
  account_count: number;
  accounts: Array<{
    account_id: string;
    account_name: string;
  }>;
  // Additional fields backend is returning (not in contract)
  id?: string;
  name?: string;
  description?: string;
  total_nav?: number;
  strategy?: 'PREFERRED' | 'CORE_PLUS' | 'LDI' | 'BALANCED';
}

export interface AllocationRequest {
  order: {
    security_id: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    settlement_date: string;
    price?: number;
  };
  allocation_method: 'PRO_RATA' | 'CUSTOM_WEIGHTS' | 'MIN_DISPERSION';
  portfolio_groups: string[];
  parameters: Record<string, unknown>;
  constraints: {
    respect_cash: boolean;
    min_allocation: number;
    compliance_check: boolean;
    round_to_denomination: boolean;
  };
}

export interface AccountAllocation {
  account_id: string;
  account_name: string;
  nav: number;  // Net Asset Value - added by backend
  allocated_quantity: number;
  allocated_notional: number;
  available_cash: number;
  post_trade_cash: number;
  pre_trade_metrics: {
    active_spread_duration: number;
    contribution_to_duration: number;
    duration: number;
    oas: number;
  };
  post_trade_metrics: {
    active_spread_duration: number;
    contribution_to_duration: number;
    duration: number;
    oas: number;
  };
}

export interface AllocationPreview {
  allocation_id: string;
  timestamp: string;
  order: {
    security_id: string;
    side: string;
    total_quantity: number;
    settlement_date: string;
  };
  allocations: AccountAllocation[];
  summary: {
    total_allocated: number;
    unallocated: number;
    allocation_rate: number;
    accounts_allocated: number;
    accounts_skipped: number;
    dispersion_metrics: {
      pre_trade_std_dev: number;
      post_trade_std_dev: number;
      improvement: number;
      max_deviation: number;
      min_deviation: number;
    };
  };
  warnings: Array<{
    type: 'INSUFFICIENT_CASH' | 'MIN_LOT_SIZE' | 'COMPLIANCE' | 'ROUNDING';
    account_id: string;
    message: string;
  }>;
  errors: Array<{
    code: string;
    message: string;
    details: Record<string, unknown>;
  }>;
}

export interface CommitResponse {
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  aladdin_order_ids: string[];
  allocations: Array<{
    account_id: string;
    aladdin_order_id: string;
    status: 'SUBMITTED' | 'FAILED';
    message: string;
  }>;
  audit_id: string;
}

export const allocationApi = createApi({
  reducerPath: 'allocationApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['PortfolioGroups', 'Securities', 'Allocations'],
  endpoints: (builder) => ({
    // Portfolio endpoints
    getPortfolioGroups: builder.query<{ portfolio_groups: PortfolioGroup[] }, void>({
      query: () => '/portfolio-groups',
      providesTags: ['PortfolioGroups'],
    }),

    // Security endpoints
    searchSecurities: builder.query<{ securities: Security[] }, string>({
      query: (query) => `/securities/search?query=${encodeURIComponent(query)}`,
      providesTags: ['Securities'],
    }),

    // Allocation endpoints
    previewAllocation: builder.mutation<AllocationPreview, AllocationRequest>({
      query: (request) => ({
        url: '/allocations/preview',
        method: 'POST',
        body: request,
      }),
    }),

    commitAllocation: builder.mutation<CommitResponse, { allocation_id: string; comment?: string; override_warnings?: boolean }>({
      query: ({ allocation_id, ...body }) => ({
        url: `/allocations/${allocation_id}/commit`,
        method: 'POST',
        body,
      }),
    }),

    // Order management endpoints
    modifyOrder: builder.mutation<{ status: string; aladdin_order_id: string; message: string }, { order_id: string; quantity: number; comment?: string }>({
      query: ({ order_id, ...body }) => ({
        url: `/orders/${order_id}`,
        method: 'PUT',
        body,
      }),
    }),

    cancelOrder: builder.mutation<{ status: string; message: string }, { order_id: string; reason: string }>({
      query: ({ order_id, ...body }) => ({
        url: `/orders/${order_id}`,
        method: 'DELETE',
        body,
      }),
    }),
  }),
});

export const {
  useGetPortfolioGroupsQuery,
  useSearchSecuritiesQuery,
  usePreviewAllocationMutation,
  useCommitAllocationMutation,
  useModifyOrderMutation,
  useCancelOrderMutation,
} = allocationApi;