import React, { useState } from 'react';
import {
  Box,
  TextField,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormLabel,
  Button,
  Typography,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { addBusinessDays, format } from 'date-fns';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import SecuritySearch from '../common/SecuritySearch';
import type { Security } from '../../features/allocation/allocationApi';
import { useAppDispatch } from '../../hooks/redux';
import { setOrderDetails } from '../../features/allocation/allocationSlice';

const schema = yup.object({
  security: yup.object().nullable().required('Security is required'),
  side: yup.string().oneOf(['BUY', 'SELL'] as const).required('Side is required'),
  quantity: yup
    .number()
    .positive('Quantity must be positive')
    .required('Quantity is required')
    .min(1000, 'Minimum quantity is 1,000'),
  settlementDate: yup.date().required('Settlement date is required'),
  price: yup.number().positive('Price must be positive').nullable(),
});

interface OrderEntryFormData {
  security: Security | null;
  side: 'BUY' | 'SELL';
  quantity: number;
  settlementDate: Date;
  price?: number | null;
}

interface OrderEntryProps {
  onNext: () => void;
}

const OrderEntry: React.FC<OrderEntryProps> = ({ onNext }) => {
  const dispatch = useAppDispatch();
  const [selectedSecurity, setSelectedSecurity] = useState<Security | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<OrderEntryFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      security: null,
      side: 'BUY',
      quantity: undefined,
      settlementDate: addBusinessDays(new Date(), 2), // T+2 default
      price: null,
    },
  });


  const handleSecuritySelect = (security: Security) => {
    setSelectedSecurity(security);
    setValue('security', security);
  };

  const formatNumber = (value: string) => {
    // Remove non-numeric characters except decimal
    const cleanValue = value.replace(/[^0-9.]/g, '');
    // Format with commas
    const parts = cleanValue.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const onSubmit = (data: OrderEntryFormData) => {
    if (!data.security) return;

    dispatch(
      setOrderDetails({
        security_id: data.security.cusip,
        side: data.side,
        quantity: data.quantity,
        settlement_date: format(data.settlementDate, 'yyyy-MM-dd'),
        price: data.price || undefined,
      })
    );
    onNext();
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit as any)}>
      <Typography variant="h6" gutterBottom>
        Order Details
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Security Search */}
        <Controller
          name="security"
          control={control}
          render={() => (
            <SecuritySearch
              onSelect={handleSecuritySelect}
              label="Search Security (CUSIP or Ticker)"
              required
              error={!!errors.security}
              helperText={errors.security?.message}
            />
          )}
        />

        {/* Security Details Display */}
        {selectedSecurity && (
          <Alert severity="info" sx={{ mt: 1 }}>
            <Typography variant="body2">
              <strong>Selected Security:</strong> {selectedSecurity.description}
            </Typography>
            <Typography variant="body2">
              <strong>CUSIP:</strong> {selectedSecurity.cusip} | 
              <strong> Coupon:</strong> {selectedSecurity.coupon}% | 
              <strong> Maturity:</strong> {new Date(selectedSecurity.maturity).toLocaleDateString()} | 
              <strong> Duration:</strong> {selectedSecurity.duration.toFixed(2)}
            </Typography>
          </Alert>
        )}

        {/* Side and Quantity Row */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl component="fieldset" error={!!errors.side}>
            <FormLabel component="legend">Side</FormLabel>
            <Controller
              name="side"
              control={control}
              render={({ field }) => (
                <RadioGroup {...field} row>
                  <FormControlLabel value="BUY" control={<Radio />} label="Buy" />
                  <FormControlLabel value="SELL" control={<Radio />} label="Sell" />
                </RadioGroup>
              )}
            />
          </FormControl>

          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Controller
              name="quantity"
              control={control}
              render={({ field: { onChange, value, ...field } }) => (
                <TextField
                  {...field}
                  label="Quantity"
                  fullWidth
                  required
                  error={!!errors.quantity}
                  helperText={errors.quantity?.message || 'Minimum denomination: 1,000'}
                  value={value ? formatNumber(value.toString()) : ''}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/[^0-9]/g, '');
                    onChange(numericValue ? parseInt(numericValue, 10) : '');
                  }}
                  InputProps={{
                    inputProps: { min: 1000, step: 1000 },
                  }}
                />
              )}
            />
          </Box>
        </Box>

        {/* Settlement Date and Price Row */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Controller
                name="settlementDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="Settlement Date"
                    value={field.value}
                    onChange={(newValue) => field.onChange(newValue)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        error: !!errors.settlementDate,
                        helperText: errors.settlementDate?.message || 'Default: T+2',
                      },
                    }}
                  />
                )}
              />
            </LocalizationProvider>
          </Box>

          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Controller
              name="price"
              control={control}
              render={({ field: { onChange, value, ...field } }) => (
                <TextField
                  {...field}
                  label="Price Override (Optional)"
                  fullWidth
                  type="number"
                  error={!!errors.price}
                  helperText={errors.price?.message || 'Leave blank to use market price'}
                  value={value || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    onChange(val ? parseFloat(val) : null);
                  }}
                  InputProps={{
                    inputProps: { min: 0, step: 0.01 },
                  }}
                />
              )}
            />
          </Box>
        </Box>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={!selectedSecurity}
        >
          Next: Select Allocation Method
        </Button>
      </Box>
    </Box>
  );
};

export default OrderEntry;