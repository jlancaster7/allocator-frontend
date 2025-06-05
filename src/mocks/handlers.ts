import { http, HttpResponse } from 'msw';

const API_URL = 'http://localhost:5000/v1';

// Mock data
const mockUser = {
  id: '123',
  username: 'testuser',
  permissions: ['trade', 'view_portfolios'],
};

const mockSecurities = [
  {
    cusip: '912828C58',
    ticker: 'T',
    description: 'US Treasury Note 2.5% 05/31/2024',
    coupon: 2.5,
    maturity: '2024-05-31',
    duration: 1.92,
    oas: 0.15,
    min_denomination: 1000,
  },
  {
    cusip: '459200HU8',
    ticker: 'IBM',
    description: 'IBM Corp 3.45% 02/19/2026',
    coupon: 3.45,
    maturity: '2026-02-19',
    duration: 2.85,
    oas: 0.95,
    min_denomination: 1000,
  },
  {
    cusip: '594918BP8',
    ticker: 'MSFT',
    description: 'Microsoft Corp 2.4% 08/08/2026',
    coupon: 2.4,
    maturity: '2026-08-08',
    duration: 3.12,
    oas: 0.45,
    min_denomination: 1000,
  },
];

const mockPortfolioGroups = [
  {
    group_id: 'PUBLICPRE',
    group_name: 'Public Preferred',
    account_count: 12,
    accounts: [
      { account_id: 'ACC001', account_name: 'Public Preferred Fund A' },
      { account_id: 'ACC002', account_name: 'Public Preferred Fund B' },
      { account_id: 'ACC003', account_name: 'Public Preferred Fund C' },
    ],
  },
  {
    group_id: 'BIG6',
    group_name: 'Big 6 Portfolios',
    account_count: 6,
    accounts: [
      { account_id: 'ACC004', account_name: 'Big 6 Growth Fund' },
      { account_id: 'ACC005', account_name: 'Big 6 Value Fund' },
      { account_id: 'ACC006', account_name: 'Big 6 Income Fund' },
    ],
  },
  {
    group_id: 'DP-LB-USD',
    group_name: 'DP LB USD',
    account_count: 8,
    accounts: [
      { account_id: 'ACC007', account_name: 'DP LB USD Core' },
      { account_id: 'ACC008', account_name: 'DP LB USD Plus' },
    ],
  },
  {
    group_id: 'OPNIC',
    group_name: 'OPNIC',
    account_count: 15,
    accounts: [
      { account_id: 'ACC009', account_name: 'OPNIC Balanced' },
      { account_id: 'ACC010', account_name: 'OPNIC Conservative' },
    ],
  },
];

const mockAllocationPreview = {
  allocation_id: 'alloc-123',
  timestamp: new Date().toISOString(),
  order: {
    security_id: '912828C58',
    side: 'BUY',
    total_quantity: 1000000,
    settlement_date: '2024-01-15',
  },
  allocations: [
    {
      account_id: 'ACC001',
      account_name: 'Growth Fund A',
      allocated_quantity: 200000,
      allocated_notional: 200000,
      available_cash: 5000000,
      post_trade_cash: 4800000,
      pre_trade_metrics: {
        active_spread_duration: 4.5,
        contribution_to_duration: 3.2,
        duration: 5.1,
        oas: 0.95,
      },
      post_trade_metrics: {
        active_spread_duration: 4.3,
        contribution_to_duration: 3.1,
        duration: 4.9,
        oas: 0.92,
      },
    },
    {
      account_id: 'ACC002',
      account_name: 'Growth Fund B',
      allocated_quantity: 300000,
      allocated_notional: 300000,
      available_cash: 8000000,
      post_trade_cash: 7700000,
      pre_trade_metrics: {
        active_spread_duration: 4.8,
        contribution_to_duration: 3.5,
        duration: 5.3,
        oas: 0.98,
      },
      post_trade_metrics: {
        active_spread_duration: 4.6,
        contribution_to_duration: 3.4,
        duration: 5.1,
        oas: 0.95,
      },
    },
  ],
  summary: {
    total_allocated: 1000000,
    unallocated: 0,
    allocation_rate: 1.0,
    accounts_allocated: 5,
    accounts_skipped: 0,
    dispersion_metrics: {
      pre_trade_std_dev: 0.25,
      post_trade_std_dev: 0.18,
      improvement: 0.28,
      max_deviation: 0.5,
      min_deviation: 0.1,
    },
  },
  warnings: [],
  errors: [],
};

export const handlers = [
  // Authentication
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = await request.json() as { username: string; password: string };
    
    if (body.username === 'testuser' && body.password === 'password123') {
      return HttpResponse.json({
        access_token: 'mock-jwt-token',
        refresh_token: 'mock-refresh-token',
        user: mockUser,
      });
    }
    
    return HttpResponse.json(
      { message: 'Invalid username or password' },
      { status: 401 }
    );
  }),

  // Security search
  http.get(`${API_URL}/securities/search`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('query')?.toLowerCase() || '';
    
    if (query.length < 3) {
      return HttpResponse.json({ securities: [] });
    }
    
    const filtered = mockSecurities.filter(
      (sec) =>
        sec.cusip.toLowerCase().includes(query) ||
        sec.ticker.toLowerCase().includes(query) ||
        sec.description.toLowerCase().includes(query)
    );
    
    return HttpResponse.json({ securities: filtered });
  }),

  // Portfolio groups
  http.get(`${API_URL}/portfolio-groups`, () => {
    return HttpResponse.json({ portfolio_groups: mockPortfolioGroups });
  }),

  // Allocation preview
  http.post(`${API_URL}/allocations/preview`, async () => {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    return HttpResponse.json(mockAllocationPreview);
  }),

  // Commit allocation
  http.post(`${API_URL}/allocations/:allocationId/commit`, async () => {
    
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    return HttpResponse.json({
      status: 'SUCCESS',
      aladdin_order_ids: ['ALAD001', 'ALAD002', 'ALAD003', 'ALAD004', 'ALAD005'],
      allocations: mockAllocationPreview.allocations.map((alloc) => ({
        account_id: alloc.account_id,
        aladdin_order_id: `ALAD-${alloc.account_id}`,
        status: 'SUBMITTED',
        message: 'Order submitted successfully',
      })),
      audit_id: 'audit-123',
    });
  }),
];