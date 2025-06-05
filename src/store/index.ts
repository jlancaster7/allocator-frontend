import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import allocationReducer from '../features/allocation/allocationSlice';
import { allocationApi } from '../features/allocation/allocationApi';
import { authApi } from '../features/auth/authApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    allocation: allocationReducer,
    [allocationApi.reducerPath]: allocationApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/setCredentials'],
      },
    })
      .concat(allocationApi.middleware)
      .concat(authApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;