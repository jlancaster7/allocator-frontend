import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { LicenseManager } from 'ag-grid-enterprise';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { CellSelectionModule, StatusBarModule, ExcelExportModule } from 'ag-grid-enterprise';
import { store } from './store';
import './index.css';
import App from './App.tsx';

// Register AG-Grid modules
ModuleRegistry.registerModules([
  AllCommunityModule,
  CellSelectionModule,
  StatusBarModule,
  ExcelExportModule
]);

// Set AG-Grid Enterprise License Key
// TODO: Replace with your actual license key
if (import.meta.env.VITE_AG_GRID_LICENSE_KEY) {
  LicenseManager.setLicenseKey(import.meta.env.VITE_AG_GRID_LICENSE_KEY);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);