import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Box,
  Chip,
  FormHelperText,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { useGetPortfolioGroupsQuery } from '../../features/allocation/allocationApi';

interface PortfolioGroupSelectorProps {
  value: string[];
  onChange: (value: string[]) => void;
  error?: boolean;
  helperText?: string;
  required?: boolean;
}

const PortfolioGroupSelector: React.FC<PortfolioGroupSelectorProps> = ({
  value,
  onChange,
  error = false,
  helperText = '',
  required = false,
}) => {
  const { data, isLoading } = useGetPortfolioGroupsQuery();
  
  // Map backend response to match API contract
  const portfolioGroups = React.useMemo(() => {
    if (!data?.portfolio_groups) return [];
    
    return data.portfolio_groups.map((group: any) => ({
      // Use contract fields if available, otherwise map from backend fields
      group_id: group.group_id || group.id,
      group_name: group.group_name || group.name,
      account_count: group.account_count,
      accounts: group.accounts || [],
      // Keep additional fields if provided
      ...group
    }));
  }, [data]);

  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const selectedValues = event.target.value;
    onChange(typeof selectedValues === 'string' ? selectedValues.split(',') : selectedValues);
  };

  const handleSelectAll = () => {
    if (value.length === portfolioGroups.length) {
      onChange([]);
    } else {
      onChange(portfolioGroups.map(group => group.id));
    }
  };

  const getTotalAccounts = () => {
    return portfolioGroups
      .filter(group => value.includes(group.id))
      .reduce((sum, group) => sum + group.account_count, 0);
  };

  return (
    <FormControl fullWidth error={error} required={required}>
      <InputLabel id="portfolio-group-select-label">Portfolio Groups</InputLabel>
      <Select
        labelId="portfolio-group-select-label"
        id="portfolio-group-select"
        multiple
        value={value}
        onChange={handleChange}
        label="Portfolio Groups"
        sx={{
          minWidth: '300px',
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              minWidth: '350px',
              maxHeight: '400px',
            }
          }
        }}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map((value) => {
              const group = portfolioGroups.find(g => g.id === value);
              return (
                <Chip
                  key={value}
                  label={`${group?.name || value} (${group?.account_count || 0})`}
                  size="small"
                />
              );
            })}
          </Box>
        )}
        disabled={isLoading}
      >
        <MenuItem
          onClick={handleSelectAll}
          sx={{ fontWeight: 'bold', borderBottom: 1, borderColor: 'divider' }}
        >
          <Checkbox
            checked={value.length === portfolioGroups.length && portfolioGroups.length > 0}
            indeterminate={value.length > 0 && value.length < portfolioGroups.length}
          />
          <ListItemText primary="Select All" />
        </MenuItem>
        
        {portfolioGroups.map((group) => (
          <MenuItem key={group.group_id} value={group.group_id}>
            <Checkbox checked={value.indexOf(group.group_id) > -1} />
            <ListItemText
              primary={`${group?.group_name || 'Unknown'} (${group?.group_id || 'N/A'})`}
              secondary={`${group?.account_count || 0} accounts`}
            />
          </MenuItem>
        ))}
      </Select>
      
      <FormHelperText>
        {helperText || (value.length > 0 && `${value.length} groups selected, ${getTotalAccounts()} total accounts`)}
      </FormHelperText>
    </FormControl>
  );
};

export default PortfolioGroupSelector;