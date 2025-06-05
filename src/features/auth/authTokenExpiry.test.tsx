import { render, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { beforeEach, it, expect, describe } from 'vitest';
import { server } from '../../mocks/server';

import AllocationMethodSelector from '../../components/allocation/AllocationMethodSelector';
import authReducer from './authSlice';
import allocationReducer from '../allocation/allocationSlice';
import { allocationApi } from '../allocation/allocationApi';
import { authApi } from './authApi';
import theme from '../../styles/theme';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const API_URL = 'http://localhost:5000/v1';

// Helper to create test store
const createTestStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
      allocation: allocationReducer,
      allocationApi: allocationApi.reducer,
      authApi: authApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        allocationApi.middleware,
        authApi.middleware
      ),
    preloadedState,
  });
};

describe('Auth Token Expiry', () => {
  beforeEach(() => {
    // Override handlers for this test
    server.use(
      // Mock failed refresh (token expired)
      http.post(`${API_URL}/auth/refresh`, () => {
        return HttpResponse.json(
          { message: 'Refresh token expired' },
          { status: 401 }
        );
      }),

      // Mock API call that will trigger 401
      http.get(`${API_URL}/portfolio-groups`, () => {
        return HttpResponse.json(
          { message: 'Access token expired' },
          { status: 401 }
        );
      })
    );
  });

  it('should dispatch logout when API call fails with 401 and refresh fails', async () => {
    // Set up initial authenticated state with expired tokens
    localStorage.setItem('accessToken', 'expired-token');
    localStorage.setItem('refreshToken', 'expired-refresh-token');

    const initialState = {
      auth: {
        user: {
          id: '123',
          username: 'testuser',
          permissions: ['trade', 'view_portfolios'],
        },
        token: 'expired-token',
        refreshToken: 'expired-refresh-token',
        isAuthenticated: true,
      },
      allocation: {
        currentStep: 1,
        orderDetails: null,
        selectedPortfolioGroups: [],
        allocationMethod: {
          method: 'PRO_RATA' as const,
          parameters: {},
        },
        allocationConstraints: {
          respect_cash: true,
          min_allocation: 1000,
          compliance_check: true,
          round_to_denomination: true,
        },
      },
    };

    const store = createTestStore(initialState);
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <AllocationMethodSelector 
                onNext={() => {}} 
                onBack={() => {}} 
              />
            </LocalizationProvider>
          </ThemeProvider>
        </BrowserRouter>
      </Provider>
    );

    // Wait for the API call to fail and auth to be cleared
    await waitFor(
      () => {
        const finalState = store.getState();
        expect(finalState.auth.isAuthenticated).toBe(false);
      },
      { timeout: 3000 }
    );

    // Verify that auth state is cleared
    const finalState = store.getState();
    expect(finalState.auth.token).toBe(null);
    expect(finalState.auth.refreshToken).toBe(null);
    expect(finalState.auth.user).toBe(null);

    // Verify localStorage is cleared
    expect(localStorage.getItem('accessToken')).toBe(null);
    expect(localStorage.getItem('refreshToken')).toBe(null);
  });
});