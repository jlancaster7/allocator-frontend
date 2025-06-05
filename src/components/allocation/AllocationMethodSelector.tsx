import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Slider,
  Divider,
  FormHelperText,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { setPortfolioGroups, setAllocationMethod } from '../../features/allocation/allocationSlice';
import { useGetPortfolioGroupsQuery } from '../../features/allocation/allocationApi';
import PortfolioGroupSelector from '../common/PortfolioGroupSelector';

interface AllocationMethodSelectorProps {
  onNext: () => void;
  onBack: () => void;
}

interface CustomWeight {
  account_id: string;
  account_name: string;
  weight: number;
}

const AllocationMethodSelector: React.FC<AllocationMethodSelectorProps> = ({ onNext, onBack }) => {
  const dispatch = useAppDispatch();
  const { selectedPortfolioGroups, allocationMethod } = useAppSelector((state) => state.allocation);
  
  const [localPortfolioGroups, setLocalPortfolioGroups] = useState<string[]>(selectedPortfolioGroups);
  const [method, setMethod] = useState(allocationMethod?.method || 'PRO_RATA');
  const [customWeights, setCustomWeights] = useState<CustomWeight[]>([]);
  const [dispersionTolerance, setDispersionTolerance] = useState(5);
  const [targetMetric, setTargetMetric] = useState('ACTIVE_SPREAD_DURATION');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get portfolio groups data from API
  const { data: portfolioGroupsData } = useGetPortfolioGroupsQuery();

  useEffect(() => {
    if (method === 'CUSTOM_WEIGHTS') {
      // Get accounts from selected portfolio groups
      const getAccountsFromSelectedGroups = () => {
        if (!portfolioGroupsData?.portfolio_groups) return [];
        
        return portfolioGroupsData.portfolio_groups
          .filter(group => localPortfolioGroups.includes(group.group_id))
          .flatMap(group => group.accounts);
      };

      // Initialize custom weights with equal distribution when method changes or groups change
      const accounts = getAccountsFromSelectedGroups();
      if (accounts.length > 0) {
        const initialWeights = accounts.map(account => ({
          account_id: account.account_id,
          account_name: account.account_name,
          weight: Number((100 / accounts.length).toFixed(2)),
        }));
        setCustomWeights(initialWeights);
      }
    }
  }, [method, localPortfolioGroups, portfolioGroupsData]);

  const handlePortfolioGroupChange = (groups: string[]) => {
    setLocalPortfolioGroups(groups);
    setErrors({ ...errors, portfolioGroups: '' });
  };

  const handleMethodChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMethod(event.target.value as 'PRO_RATA' | 'CUSTOM_WEIGHTS' | 'MIN_DISPERSION');
    setErrors({});
  };

  const handleWeightChange = (accountId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setCustomWeights(prev =>
      prev.map(w => w.account_id === accountId ? { ...w, weight: numValue } : w)
    );
  };

  const validateAndProceed = () => {
    const newErrors: Record<string, string> = {};

    if (localPortfolioGroups.length === 0) {
      newErrors.portfolioGroups = 'Please select at least one portfolio group';
    }

    if (method === 'CUSTOM_WEIGHTS') {
      const totalWeight = customWeights.reduce((sum, w) => sum + w.weight, 0);
      if (Math.abs(totalWeight - 100) > 0.01) {
        newErrors.weights = `Weights must sum to 100% (currently ${totalWeight.toFixed(2)}%)`;
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Save to Redux
      dispatch(setPortfolioGroups(localPortfolioGroups));
      
      let parameters: Record<string, unknown> = {};
      
      switch (method) {
        case 'PRO_RATA':
          parameters = { base_metric: 'NAV' };
          break;
        case 'CUSTOM_WEIGHTS':
          parameters = {
            weights: customWeights.reduce((acc, w) => ({
              ...acc,
              [w.account_id]: w.weight / 100
            }), {})
          };
          break;
        case 'MIN_DISPERSION':
          parameters = {
            target_metric: targetMetric,
            tolerance: dispersionTolerance / 100
          };
          break;
      }

      dispatch(setAllocationMethod({
        method,
        parameters
      }));

      onNext();
    }
  };

  const renderMethodParameters = () => {
    switch (method) {
      case 'PRO_RATA':
        return (
          <Alert severity="info">
            Allocation will be distributed proportionally based on each account's Net Asset Value (NAV).
          </Alert>
        );

      case 'CUSTOM_WEIGHTS':
        return (
          <Box sx={{ mt: 2 }}>
            {errors.weights && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.weights}
              </Alert>
            )}
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Account</TableCell>
                    <TableCell align="right">Weight (%)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customWeights.map((weight) => (
                    <TableRow key={weight.account_id}>
                      <TableCell>{weight.account_name}</TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          value={weight.weight}
                          onChange={(e) => handleWeightChange(weight.account_id, e.target.value)}
                          inputProps={{
                            min: 0,
                            max: 100,
                            step: 0.01,
                          }}
                          size="small"
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell><strong>Total</strong></TableCell>
                    <TableCell align="right">
                      <strong>
                        {customWeights.reduce((sum, w) => sum + w.weight, 0).toFixed(2)}%
                      </strong>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );

      case 'MIN_DISPERSION':
        return (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ mb: 3 }}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Target Metric</FormLabel>
                <RadioGroup
                  value={targetMetric}
                  onChange={(e) => setTargetMetric(e.target.value)}
                  row
                >
                  <FormControlLabel
                    value="ACTIVE_SPREAD_DURATION"
                    control={<Radio />}
                    label="Active Spread Duration"
                  />
                  <FormControlLabel
                    value="DURATION"
                    control={<Radio />}
                    label="Duration"
                  />
                  <FormControlLabel
                    value="OAS"
                    control={<Radio />}
                    label="OAS"
                  />
                </RadioGroup>
              </FormControl>
            </Box>
            
            <Box>
              <Typography gutterBottom>
                Tolerance: {dispersionTolerance}%
              </Typography>
              <Slider
                value={dispersionTolerance}
                onChange={(_, value) => setDispersionTolerance(value as number)}
                min={1}
                max={20}
                marks={[
                  { value: 5, label: '5%' },
                  { value: 10, label: '10%' },
                  { value: 15, label: '15%' },
                ]}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}%`}
              />
              <FormHelperText>
                The optimization will stop when the standard deviation improvement is within this tolerance
              </FormHelperText>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Allocation Method Selection
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Portfolio Group Selection */}
        <Box>
          <PortfolioGroupSelector
            value={localPortfolioGroups}
            onChange={handlePortfolioGroupChange}
            error={!!errors.portfolioGroups}
            helperText={errors.portfolioGroups}
            required
          />
        </Box>

        {/* Allocation Method Selection */}
        <Box>
          <Divider sx={{ my: 2 }} />
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ mb: 2 }}>
              Select Allocation Method
            </FormLabel>
            <RadioGroup value={method} onChange={handleMethodChange}>
              <FormControlLabel
                value="PRO_RATA"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1">Pro-Rata Allocation</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Allocate based on account NAV proportions
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="CUSTOM_WEIGHTS"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1">Custom Weights</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Manually specify allocation percentages per account
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="MIN_DISPERSION"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body1">Minimum Dispersion</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Optimize to minimize active spread duration dispersion
                    </Typography>
                  </Box>
                }
              />
            </RadioGroup>
          </FormControl>
        </Box>

        {/* Method-specific parameters */}
        <Box>
          {renderMethodParameters()}
        </Box>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={onBack}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={validateAndProceed}
          disabled={localPortfolioGroups.length === 0}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
};

export default AllocationMethodSelector;