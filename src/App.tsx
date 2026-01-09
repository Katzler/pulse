import { BrowserRouter } from 'react-router-dom';

import { AppProvider, ThemeProvider } from './presentation/context';
import { AppRouter } from './presentation/router';

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
