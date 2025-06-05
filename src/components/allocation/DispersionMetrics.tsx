import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingDown, CheckCircle, Warning } from '@mui/icons-material';
import { formatDecimal, formatPercent } from '../../utils/formatters';
import type { AllocationPreview } from '../../features/allocation/allocationApi';

interface DispersionMetricsProps {
  preview: AllocationPreview;
}

const DispersionMetrics: React.FC<DispersionMetricsProps> = ({ preview }) => {
  const { dispersion_metrics } = preview.summary;
  
  // Prepare data for the chart
  const chartData = [
    {
      name: 'Pre-Trade',
      'Std Deviation': dispersion_metrics.pre_trade_std_dev,
    },
    {
      name: 'Post-Trade',
      'Std Deviation': dispersion_metrics.post_trade_std_dev,
    },
  ];

  const improvementPercent = dispersion_metrics.improvement * 100;
  const isImproved = improvementPercent > 0;

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Dispersion Metrics Analysis
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Metrics Summary */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 33.333%' } }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Standard Deviation Improvement
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography variant="h4" sx={{ mr: 1, color: isImproved ? 'success.main' : 'warning.main' }}>
                {formatPercent(dispersion_metrics.improvement)}
              </Typography>
              {isImproved ? (
                <TrendingDown color="success" />
              ) : (
                <Warning color="warning" />
              )}
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Pre-Trade Std Dev
            </Typography>
            <Typography variant="h5">
              {formatDecimal(dispersion_metrics.pre_trade_std_dev, 3)}
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Post-Trade Std Dev
            </Typography>
            <Typography variant="h5" sx={{ color: 'primary.main' }}>
              {formatDecimal(dispersion_metrics.post_trade_std_dev, 3)}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Deviation Range
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip 
                label={`Min: ${formatDecimal(dispersion_metrics.min_deviation, 3)}`}
                size="small"
                variant="outlined"
              />
              <Chip 
                label={`Max: ${formatDecimal(dispersion_metrics.max_deviation, 3)}`}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>
        </Box>

        {/* Chart */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '0 0 66.667%' } }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Standard Deviation', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value: number) => formatDecimal(value, 3)} />
              <Legend />
              <Bar 
                dataKey="Std Deviation" 
                fill="#1976d2"
                label={{ position: 'top', formatter: (value: number) => formatDecimal(value, 3) }}
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Box>

      {/* Status Indicator */}
      <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isImproved ? (
          <>
            <CheckCircle color="success" sx={{ mr: 1 }} />
            <Typography color="success.main">
              Dispersion improved by {formatPercent(dispersion_metrics.improvement)}
            </Typography>
          </>
        ) : (
          <>
            <Warning color="warning" sx={{ mr: 1 }} />
            <Typography color="warning.main">
              Dispersion increased - Review allocation method
            </Typography>
          </>
        )}
      </Box>
    </Paper>
  );
};

export default DispersionMetrics;