import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Download as DownloadIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridApi } from 'ag-grid-community';
import { useAppSelector } from '../../hooks/redux';
import { usePreviewAllocationMutation, useCommitAllocationMutation } from '../../features/allocation/allocationApi';
import { formatNumber, formatCurrency, formatDecimal } from '../../utils/formatters';
import DispersionMetrics from './DispersionMetrics';

interface AllocationPreviewProps {
  onBack: () => void;
  onCommit: () => void;
}

const AllocationPreview: React.FC<AllocationPreviewProps> = ({ onBack, onCommit }) => {
  const gridRef = useRef<AgGridReact>(null);
  const [gridApi, setGridApi] = useState<GridApi>();
  const [commitDialogOpen, setCommitDialogOpen] = useState(false);
  const [commitComment, setCommitComment] = useState('');
  const [overrideWarnings, setOverrideWarnings] = useState(false);

  const { orderDetails, selectedPortfolioGroups, allocationMethod, allocationConstraints } = 
    useAppSelector((state) => state.allocation);

  const [previewAllocation, { data: preview, isLoading: isPreviewLoading, error: previewError }] = 
    usePreviewAllocationMutation();
  
  const [commitAllocation, { isLoading: isCommitting }] = useCommitAllocationMutation();

  // Trigger preview on mount
  React.useEffect(() => {
    if (orderDetails && selectedPortfolioGroups.length > 0 && allocationMethod) {
      previewAllocation({
        order: orderDetails,
        allocation_method: allocationMethod.method,
        portfolio_groups: selectedPortfolioGroups,
        parameters: allocationMethod.parameters,
        constraints: allocationConstraints,
      });
    }
  }, [allocationConstraints, allocationMethod, orderDetails, previewAllocation, selectedPortfolioGroups]);

  // Column definitions for AG-Grid
  const columnDefs: ColDef[] = useMemo(() => {
    const baseColumns: ColDef[] = [
      {
        field: 'account_id',
        headerName: 'Account ID',
        width: 120,
        pinned: 'left',
      },
      {
        field: 'account_name',
        headerName: 'Account Name',
        width: 200,
        pinned: 'left',
      },
    ];

    // Add requested allocation columns if using custom weights
    const isCustomWeights = allocationMethod?.method === 'CUSTOM_WEIGHTS';
    const requestedColumns: ColDef[] = isCustomWeights ? [
      {
        field: 'requested_type',
        headerName: 'Request Type',
        width: 120,
        valueFormatter: (params) => {
          if (!params.value) return '';
          switch (params.value) {
            case 'DOLLAR_AMOUNT': return '$ Amount';
            case 'PERCENTAGE': return 'Percentage';
            case 'QUANTITY': return 'Quantity';
            default: return params.value;
          }
        },
      },
      {
        field: 'requested_value',
        headerName: 'Requested',
        width: 130,
        valueFormatter: (params) => {
          if (!params.value || !params.data.requested_type) return '';
          switch (params.data.requested_type) {
            case 'DOLLAR_AMOUNT':
              return formatCurrency(params.value);
            case 'PERCENTAGE':
              return `${(params.value * 100).toFixed(2)}%`;
            case 'QUANTITY':
              return formatNumber(params.value);
            default:
              return params.value;
          }
        },
        cellClass: 'text-right',
      },
      {
        field: 'allocation_source',
        headerName: 'Source',
        width: 100,
        valueFormatter: (params) => {
          if (!params.value) return '';
          switch (params.value) {
            case 'DIRECT': return 'Direct';
            case 'REMAINDER': return 'Remainder';
            case 'PRO_RATA': return 'Pro-Rata';
            default: return params.value;
          }
        },
      },
    ] : [];

    const allocationColumns: ColDef[] = [
      {
        field: 'allocated_quantity',
        headerName: 'Allocated Qty',
        width: 130,
        valueFormatter: (params) => formatNumber(params.value),
        cellClass: 'text-right',
      },
      {
        field: 'allocated_notional',
        headerName: 'Notional ($)',
        width: 130,
        valueFormatter: (params) => formatCurrency(params.value),
        cellClass: 'text-right',
      },
    ];

    return [...baseColumns, ...requestedColumns, ...allocationColumns,
    {
      field: 'available_cash',
      headerName: 'Available Cash',
      width: 130,
      valueFormatter: (params) => formatCurrency(params.value),
      cellClass: 'text-right',
    },
    {
      field: 'post_trade_cash',
      headerName: 'Post-Trade Cash',
      width: 130,
      valueFormatter: (params) => formatCurrency(params.value),
      cellClass: (params) => params.value < 0 ? 'text-danger' : 'text-right',
    },
    {
      field: 'pre_trade_metrics.active_spread_duration',
      headerName: 'Pre-Trade ASD',
      width: 120,
      valueFormatter: (params) => formatDecimal(params.value, 3),
      cellClass: 'text-right',
    },
    {
      field: 'post_trade_metrics.active_spread_duration',
      headerName: 'Post-Trade ASD',
      width: 120,
      valueFormatter: (params) => formatDecimal(params.value, 3),
      cellClass: 'text-right',
    },
    {
      headerName: 'ASD Change',
      width: 110,
      valueGetter: (params) => {
        const pre = params.data.pre_trade_metrics?.active_spread_duration || 0;
        const post = params.data.post_trade_metrics?.active_spread_duration || 0;
        return post - pre;
      },
      valueFormatter: (params) => formatDecimal(params.value, 3),
      cellClass: (params) => params.value > 0 ? 'text-danger' : 'text-success',
    },
    ];
  }, [allocationMethod]);

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
  }), []);

  const onGridReady = useCallback((params: { api: GridApi }) => {
    setGridApi(params.api);
  }, []);

  const exportToExcel = () => {
    gridApi?.exportDataAsExcel({
      fileName: `allocation_preview_${new Date().toISOString().split('T')[0]}.xlsx`,
      sheetName: 'Allocation Preview',
    });
  };

  const handleCommitClick = () => {
    if (preview?.warnings && preview.warnings.length > 0) {
      setOverrideWarnings(true);
    }
    setCommitDialogOpen(true);
  };

  const handleCommitConfirm = async () => {
    if (!preview) return;

    try {
      await commitAllocation({
        allocation_id: preview.allocation_id,
        comment: commitComment,
        override_warnings: overrideWarnings,
      }).unwrap();

      setCommitDialogOpen(false);
      onCommit();
    } catch (error) {
      console.error('Failed to commit allocation:', error);
    }
  };

  if (isPreviewLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Calculating allocation preview...</Typography>
      </Box>
    );
  }

  if (previewError || !preview) {
    return (
      <Alert severity="error">
        <AlertTitle>Error</AlertTitle>
        Failed to generate allocation preview. Please try again.
      </Alert>
    );
  }

  const hasWarnings = preview.warnings.length > 0;
  const hasErrors = preview.errors.length > 0;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Allocation Preview
      </Typography>

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Total Allocated
            </Typography>
            <Typography variant="h6">
              {formatNumber(preview.summary.total_allocated)}
            </Typography>
          </Paper>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Allocation Rate
            </Typography>
            <Typography variant="h6">
              {(preview.summary.allocation_rate * 100).toFixed(1)}%
            </Typography>
          </Paper>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Accounts Allocated
            </Typography>
            <Typography variant="h6">
              {preview.summary.accounts_allocated}
            </Typography>
          </Paper>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Unallocated Amount
            </Typography>
            <Typography variant="h6" color={preview.summary.unallocated > 0 ? 'warning.main' : 'text.primary'}>
              {formatNumber(preview.summary.unallocated)}
            </Typography>
          </Paper>
        </Box>
      </Box>

      {/* Warnings and Errors */}
      {(hasWarnings || hasErrors) && (
        <Box sx={{ mb: 3 }}>
          {hasErrors && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>Errors Found</AlertTitle>
              <List dense>
                {preview.errors.map((error, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <ErrorIcon color="error" />
                    </ListItemIcon>
                    <ListItemText primary={error.message} />
                  </ListItem>
                ))}
              </List>
            </Alert>
          )}
          
          {hasWarnings && (
            <Alert severity="warning">
              <AlertTitle>Warnings</AlertTitle>
              <List dense>
                {preview.warnings.map((warning, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <WarningIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={warning.message}
                      secondary={warning.account_id ? `Account: ${warning.account_id}` : undefined}
                    />
                  </ListItem>
                ))}
              </List>
            </Alert>
          )}
        </Box>
      )}

      {/* AG-Grid Allocation Table */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1">Allocation Details</Typography>
            <Button
              startIcon={<DownloadIcon />}
              onClick={exportToExcel}
              size="small"
            >
              Export to Excel
            </Button>
          </Box>
        </Box>
        
        <Box className="ag-theme-material" sx={{ height: 400, width: '100%' }}>
          <AgGridReact
            ref={gridRef}
            rowData={preview.allocations}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            animateRows={true}
            rowSelection={{
              mode: 'multiRow',
              enableClickSelection: false
            }}
            cellSelection={true}
            statusBar={{
              statusPanels: [
                { statusPanel: 'agTotalAndFilteredRowCountComponent', align: 'left' },
                { statusPanel: 'agTotalRowCountComponent', align: 'center' },
                { statusPanel: 'agSelectedRowCountComponent', align: 'right' },
              ],
            }}
            theme="legacy"
          />
        </Box>
      </Paper>

      {/* Dispersion Metrics */}
      <Box sx={{ mb: 3 }}>
        <DispersionMetrics preview={preview} />
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={onBack}>
          Back
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SendIcon />}
          onClick={handleCommitClick}
          disabled={hasErrors || isCommitting}
        >
          Commit to Aladdin
        </Button>
      </Box>

      {/* Commit Confirmation Dialog */}
      <Dialog open={commitDialogOpen} onClose={() => setCommitDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Allocation Commit</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              You are about to commit this allocation to Aladdin. This action cannot be undone.
            </Typography>
          </Box>
          
          {hasWarnings && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              This allocation has {preview.warnings.length} warning(s). Please review before committing.
            </Alert>
          )}
          
          <TextField
            autoFocus
            margin="dense"
            label="Comment (Optional)"
            fullWidth
            multiline
            rows={3}
            value={commitComment}
            onChange={(e) => setCommitComment(e.target.value)}
            placeholder="Add any notes about this allocation..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommitDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCommitConfirm} 
            variant="contained" 
            color="primary"
            disabled={isCommitting}
          >
            {isCommitting ? <CircularProgress size={24} /> : 'Confirm Commit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AllocationPreview;