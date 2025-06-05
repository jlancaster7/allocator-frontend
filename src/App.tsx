import { Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, Box } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import theme from './styles/theme';
import Login from './features/auth/Login';
import AllocationWorkbench from './components/allocation/AllocationWorkbench';
import PrivateRoute from './components/common/PrivateRoute';
import AppLayout from './components/layout/AppLayout';

// AG-Grid CSS
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />
        <Box sx={{ display: 'flex', height: '100vh' }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/allocation" element={<AllocationWorkbench />} />
                {/* Add more protected routes here */}
              </Route>
            </Route>
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/allocation" replace />} />
          </Routes>
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;