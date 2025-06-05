import React from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Typography,
  Container,
} from '@mui/material';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { setCurrentStep } from '../../features/allocation/allocationSlice';
import OrderEntry from './OrderEntry';
import AllocationMethodSelector from './AllocationMethodSelector';
import AllocationPreview from './AllocationPreview';

const steps = ['Order Entry', 'Allocation Method', 'Preview & Commit'];

const AllocationWorkbench: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentStep = useAppSelector((state) => state.allocation.currentStep);

  const handleNext = () => {
    dispatch(setCurrentStep(currentStep + 1));
  };

  const handleBack = () => {
    dispatch(setCurrentStep(currentStep - 1));
  };

  const handleCommit = () => {
    // Handle successful commit - could navigate to success page or reset
    dispatch(setCurrentStep(0));
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 0:
        return <OrderEntry onNext={handleNext} />;
      case 1:
        return (
          <AllocationMethodSelector
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 2:
        return (
          <AllocationPreview
            onBack={handleBack}
            onCommit={handleCommit}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Allocation Workbench
        </Typography>
        
        <Stepper activeStep={currentStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Paper sx={{ p: 4 }}>
          {getStepContent()}
        </Paper>
      </Box>
    </Container>
  );
};

export default AllocationWorkbench;