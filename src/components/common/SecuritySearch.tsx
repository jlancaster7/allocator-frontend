import React, { useState } from 'react';
import { 
  Autocomplete, 
  TextField, 
  CircularProgress,
  Box,
  Typography,
  Chip
} from '@mui/material';
import { debounce } from '@mui/material/utils';
import { useSearchSecuritiesQuery } from '../../features/allocation/allocationApi';
import type { Security } from '../../features/allocation/allocationApi';

interface SecuritySearchProps {
  onSelect: (security: Security) => void;
  label?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
}

const SecuritySearch: React.FC<SecuritySearchProps> = ({ 
  onSelect, 
  label = 'Search by CUSIP or Ticker',
  required = false,
  error = false,
  helperText = ''
}) => {
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSecurity, setSelectedSecurity] = useState<Security | null>(null);

  const { data, isLoading } = useSearchSecuritiesQuery(searchTerm, {
    skip: searchTerm.length < 3,
  });

  const debouncedSearch = debounce((value: string) => {
    setSearchTerm(value);
  }, 300);

  const handleInputChange = (_event: React.SyntheticEvent, value: string) => {
    setInputValue(value);
    if (value.length >= 3) {
      debouncedSearch(value);
    }
  };

  const handleChange = (_event: React.SyntheticEvent, value: Security | null) => {
    setSelectedSecurity(value);
    if (value) {
      onSelect(value);
    }
  };

  const formatMaturityDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Autocomplete
      value={selectedSecurity}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      options={data?.securities || []}
      loading={isLoading}
      getOptionLabel={(option) => `${option.cusip} - ${option.description}`}
      isOptionEqualToValue={(option, value) => option.cusip === value.cusip}
      sx={{
        '& .MuiAutocomplete-popper': {
          minWidth: '600px',
        }
      }}
      componentsProps={{
        paper: {
          sx: {
            minWidth: '600px',
            width: 'auto',
          }
        },
        popper: {
          sx: {
            minWidth: '600px',
          }
        }
      }}
      renderOption={(props, option) => {
        const { key, ...otherProps } = props as any;
        return (
          <Box component="li" key={key} {...otherProps}>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body1">
                {option.cusip} - {option.ticker}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {option.description}
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip 
                  label={`Coupon: ${option.coupon}%`} 
                  size="small" 
                sx={{ mr: 1 }}
              />
              <Chip 
                label={`Maturity: ${formatMaturityDate(option.maturity)}`} 
                size="small" 
                sx={{ mr: 1 }}
              />
              <Chip 
                label={`Duration: ${option.duration.toFixed(2)}`} 
                size="small" 
              />
            </Box>
          </Box>
        </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          error={error}
          helperText={helperText}
          variant="outlined"
          fullWidth
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isLoading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      noOptionsText={
        inputValue.length < 3 
          ? "Type at least 3 characters to search" 
          : "No securities found"
      }
    />
  );
};

export default SecuritySearch;