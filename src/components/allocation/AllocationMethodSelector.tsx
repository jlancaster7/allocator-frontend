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
  Tooltip,
  Checkbox,
  Chip,
  InputAdornment,
} from '@mui/material';
import {
  Info as InfoIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { setPortfolioGroups, setAllocationMethod } from '../../features/allocation/allocationSlice';
import { useGetPortfolioGroupsQuery } from '../../features/allocation/allocationApi';
import PortfolioGroupSelector from '../common/PortfolioGroupSelector';
import AllocationTypeSelector from './AllocationTypeSelector';
import type { 
  EnhancedCustomWeight, 
  AllocationType, 
  RemainderHandling,
  CustomWeightsParameters 
} from '../../types/allocation';

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
  const [enhancedWeights, setEnhancedWeights] = useState<EnhancedCustomWeight[]>([]);
  const [useEnhancedMode, setUseEnhancedMode] = useState(true);
  const [remainderHandling, setRemainderHandling] = useState<RemainderHandling>('NONE');
  const [allowPartial, setAllowPartial] = useState(false);
  const [dispersionTolerance, setDispersionTolerance] = useState(5);
  const [targetMetric, setTargetMetric] = useState('ACTIVE_SPREAD_DURATION');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Get order details for validation
  const { orderDetails } = useAppSelector((state) => state.allocation);

  // Get portfolio groups data from API
  const { data: portfolioGroupsData } = useGetPortfolioGroupsQuery();

  useEffect(() => {
    if (method === 'CUSTOM_WEIGHTS') {
      // Get accounts from selected portfolio groups
      const getAccountsFromSelectedGroups = () => {
        if (!portfolioGroupsData?.portfolio_groups) return [];
        
        return portfolioGroupsData.portfolio_groups
          .filter(group => {
            // Handle both group_id and id fields from backend
            const groupId = group.group_id || group.id;
            return localPortfolioGroups.includes(groupId);
          })
          .flatMap(group => group.accounts || [])
          .filter(account => account && account.account_id); // Filter out null/invalid accounts
      };

      // Initialize custom weights when method changes or groups change
      const accounts = getAccountsFromSelectedGroups();
      if (accounts.length > 0) {
        if (useEnhancedMode) {
          // Initialize enhanced weights with dollar amounts
          const initialEnhanced = accounts.map(account => ({
            account_id: account.account_id,
            account_name: account.account_name || account.account_id,
            type: 'DOLLAR_AMOUNT' as AllocationType,
            value: 0,
          }));
          setEnhancedWeights(initialEnhanced);
        } else {
          // Initialize legacy weights with equal distribution
          const initialWeights = accounts.map(account => ({
            account_id: account.account_id,
            account_name: account.account_name || account.account_id,
            weight: Number((100 / accounts.length).toFixed(2)),
          }));
          setCustomWeights(initialWeights);
        }
      }
    }
  }, [method, localPortfolioGroups, portfolioGroupsData, useEnhancedMode]);

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

  const handleEnhancedWeightChange = (accountId: string, field: 'type' | 'value', value: any) => {
    setEnhancedWeights(prev =>
      prev.map(w => {
        if (w.account_id === accountId) {
          if (field === 'type') {
            return { ...w, [field]: value, value: 0 }; // Reset value when type changes
          }
          return { ...w, [field]: value };
        }
        return w;
      })
    );
  };

  const formatValueForType = (type: AllocationType, value: number): string => {
    switch (type) {
      case 'DOLLAR_AMOUNT':
        return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });
      case 'PERCENTAGE':
        return `${value}%`;
      case 'QUANTITY':
        return value.toLocaleString('en-US');
      default:
        return value.toString();
    }
  };

  const parseValueForType = (type: AllocationType, input: string): number => {
    const cleaned = input.replace(/[$,%]/g, '').replace(/,/g, '');
    const parsed = parseFloat(cleaned) || 0;
    
    if (type === 'PERCENTAGE') {
      return Math.min(100, Math.max(0, parsed));
    }
    return Math.max(0, parsed);
  };

  const validateAndProceed = () => {
    const newErrors: Record<string, string> = {};

    if (localPortfolioGroups.length === 0) {
      newErrors.portfolioGroups = 'Please select at least one portfolio group';
    }

    if (method === 'CUSTOM_WEIGHTS') {
      if (useEnhancedMode) {
        // Validate enhanced weights
        const hasAllocations = enhancedWeights.some(w => w.value > 0);
        if (!hasAllocations && remainderHandling === 'NONE') {
          newErrors.weights = 'Please specify at least one allocation or enable remainder distribution';
        }
        
        // Validate based on type
        enhancedWeights.forEach(w => {
          if (w.value > 0) {
            if (w.type === 'PERCENTAGE' && w.value > 100) {
              newErrors.weights = 'Percentage values cannot exceed 100%';
            }
            if (w.type === 'QUANTITY' && orderDetails && w.value > orderDetails.quantity) {
              newErrors.weights = 'Quantity allocations cannot exceed order quantity';
            }
          }
        });
      } else {
        // Validate legacy weights
        const totalWeight = customWeights.reduce((sum, w) => sum + w.weight, 0);
        if (Math.abs(totalWeight - 100) > 0.01) {
          newErrors.weights = `Weights must sum to 100% (currently ${totalWeight.toFixed(2)}%)`;
        }
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
          if (useEnhancedMode) {
            // Use enhanced format
            const params: CustomWeightsParameters = {
              allocations: enhancedWeights
                .filter(w => w.value > 0)
                .map(w => ({
                  account_id: w.account_id,
                  type: w.type,
                  value: w.type === 'PERCENTAGE' ? w.value / 100 : w.value,
                })),
              remainder_handling: remainderHandling,
              allow_partial: allowPartial,
            };
            parameters = params as Record<string, unknown>;
          } else {
            // Use legacy format
            parameters = {
              weights: customWeights.reduce((acc, w) => ({
                ...acc,
                [w.account_id]: w.weight / 100
              }), {})
            };
          }
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
            {/* Mode Toggle */}
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={useEnhancedMode}
                    onChange={(e) => setUseEnhancedMode(e.target.checked)}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>Use Enhanced Mode</span>
                    <Tooltip title="Enhanced mode allows you to specify exact dollar amounts, percentages, or quantities per account">
                      <InfoIcon fontSize="small" color="action" />
                    </Tooltip>
                  </Box>
                }
              />
              {useEnhancedMode && (
                <Chip 
                  label="NEW" 
                  color="primary" 
                  size="small" 
                  sx={{ fontWeight: 'bold' }}
                />
              )}
            </Box>

            {errors.weights && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.weights}
              </Alert>
            )}

            {useEnhancedMode ? (
              // Enhanced Mode UI
              <Box>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Account</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell align="right">Value</TableCell>
                        <TableCell align="right">Preview</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {enhancedWeights.map((weight) => (
                        <TableRow key={weight.account_id}>
                          <TableCell>{weight.account_name}</TableCell>
                          <TableCell>
                            <AllocationTypeSelector
                              value={weight.type}
                              onChange={(value) => handleEnhancedWeightChange(weight.account_id, 'type', value)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              value={weight.value || ''}
                              onChange={(e) => handleEnhancedWeightChange(
                                weight.account_id, 
                                'value', 
                                parseValueForType(weight.type, e.target.value)
                              )}
                              size="small"
                              sx={{ width: 150 }}
                              placeholder={weight.type === 'PERCENTAGE' ? '0-100' : '0'}
                              InputProps={{
                                startAdornment: weight.type === 'DOLLAR_AMOUNT' ? 
                                  <InputAdornment position="start">$</InputAdornment> : undefined,
                                endAdornment: weight.type === 'PERCENTAGE' ? 
                                  <InputAdornment position="end">%</InputAdornment> : undefined,
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {weight.value > 0 && (
                              <Typography variant="body2" color="text.secondary">
                                {formatValueForType(weight.type, weight.value)}
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Remainder Handling Options */}
                <Box sx={{ mt: 3 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={remainderHandling !== 'NONE'}
                        onChange={(e) => setRemainderHandling(e.target.checked ? 'PRO_RATA' : 'NONE')}
                      />
                    }
                    label="Distribute remaining bonds"
                  />
                  {remainderHandling !== 'NONE' && (
                    <RadioGroup
                      value={remainderHandling}
                      onChange={(e) => setRemainderHandling(e.target.value as RemainderHandling)}
                      sx={{ ml: 4 }}
                    >
                      <FormControlLabel 
                        value="PRO_RATA" 
                        control={<Radio size="small" />} 
                        label="Pro-rata (by NAV)" 
                      />
                      <FormControlLabel 
                        value="EQUAL" 
                        control={<Radio size="small" />} 
                        label="Equal split" 
                      />
                    </RadioGroup>
                  )}
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={allowPartial}
                        onChange={(e) => setAllowPartial(e.target.checked)}
                      />
                    }
                    label="Allow partial allocation if constraints prevent full allocation"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Box>
            ) : (
              // Legacy Mode UI
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
            )}
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