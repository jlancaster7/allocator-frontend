import React from 'react';
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
} from '@mui/material';
import {
  AttachMoney as DollarIcon,
  Percent as PercentIcon,
  Tag as QuantityIcon,
} from '@mui/icons-material';
import type { AllocationType } from '../../types/allocation';

interface AllocationTypeSelectorProps {
  value: AllocationType;
  onChange: (value: AllocationType) => void;
  disabled?: boolean;
  size?: 'small' | 'medium';
}

const AllocationTypeSelector: React.FC<AllocationTypeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  size = 'small',
}) => {
  const getIcon = (type: AllocationType) => {
    switch (type) {
      case 'DOLLAR_AMOUNT':
        return <DollarIcon fontSize="small" />;
      case 'PERCENTAGE':
        return <PercentIcon fontSize="small" />;
      case 'QUANTITY':
        return <QuantityIcon fontSize="small" />;
    }
  };

  const getLabel = (type: AllocationType) => {
    switch (type) {
      case 'DOLLAR_AMOUNT':
        return '$ Amount';
      case 'PERCENTAGE':
        return 'Percentage';
      case 'QUANTITY':
        return 'Quantity';
    }
  };

  return (
    <FormControl size={size} sx={{ minWidth: 140 }}>
      <InputLabel id="allocation-type-label">Type</InputLabel>
      <Select
        labelId="allocation-type-label"
        value={value}
        onChange={(e) => onChange(e.target.value as AllocationType)}
        disabled={disabled}
        label="Type"
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {getIcon(selected)}
            <span>{getLabel(selected)}</span>
          </Box>
        )}
      >
        <MenuItem value="DOLLAR_AMOUNT">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DollarIcon fontSize="small" color="primary" />
            <span>$ Amount</span>
          </Box>
        </MenuItem>
        <MenuItem value="PERCENTAGE">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PercentIcon fontSize="small" color="primary" />
            <span>Percentage</span>
          </Box>
        </MenuItem>
        <MenuItem value="QUANTITY">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <QuantityIcon fontSize="small" color="primary" />
            <span>Quantity</span>
          </Box>
        </MenuItem>
      </Select>
    </FormControl>
  );
};

export default AllocationTypeSelector;