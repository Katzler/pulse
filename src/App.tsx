import { BrowserRouter } from 'react-router-dom';

import { AppProvider, ThemeProvider } from './presentation/context';
import { AppRouter } from './presentation/router';

// Get base path from Vite's base config (set via VITE_BASE_PATH env var)
// This ensures routing works correctly on GitHub Pages
const basename = import.meta.env.BASE_URL;

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <BrowserRouter basename={basename}>
          <AppRouter />
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
