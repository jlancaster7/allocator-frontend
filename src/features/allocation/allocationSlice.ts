import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface OrderDetails {
  security_id: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  settlement_date: string;
  price?: number;
}

export interface AllocationMethod {
  method: 'PRO_RATA' | 'CUSTOM_WEIGHTS' | 'MIN_DISPERSION';
  parameters: Record<string, unknown>;
}

export interface AllocationConstraints {
  respect_cash: boolean;
  min_allocation: number;
  compliance_check: boolean;
  round_to_denomination: boolean;
}

interface AllocationState {
  orderDetails: OrderDetails | null;
  selectedPortfolioGroups: string[];
  allocationMethod: AllocationMethod | null;
  allocationConstraints: AllocationConstraints;
  previewId: string | null;
  currentStep: number;
}

const initialState: AllocationState = {
  orderDetails: null,
  selectedPortfolioGroups: [],
  allocationMethod: null,
  allocationConstraints: {
    respect_cash: true,
    min_allocation: 1000,
    compliance_check: true,
    round_to_denomination: true,
  },
  previewId: null,
  currentStep: 0,
};

const allocationSlice = createSlice({
  name: 'allocation',
  initialState,
  reducers: {
    setOrderDetails: (state, action: PayloadAction<OrderDetails>) => {
      state.orderDetails = action.payload;
    },
    setPortfolioGroups: (state, action: PayloadAction<string[]>) => {
      state.selectedPortfolioGroups = action.payload;
    },
    setAllocationMethod: (state, action: PayloadAction<AllocationMethod>) => {
      state.allocationMethod = action.payload;
    },
    setAllocationConstraints: (state, action: PayloadAction<Partial<AllocationConstraints>>) => {
      state.allocationConstraints = {
        ...state.allocationConstraints,
        ...action.payload,
      };
    },
    setPreviewId: (state, action: PayloadAction<string>) => {
      state.previewId = action.payload;
    },
    setCurrentStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },
    resetAllocation: () => initialState,
  },
});

export const {
  setOrderDetails,
  setPortfolioGroups,
  setAllocationMethod,
  setAllocationConstraints,
  setPreviewId,
  setCurrentStep,
  resetAllocation,
} = allocationSlice.actions;

export default allocationSlice.reducer;