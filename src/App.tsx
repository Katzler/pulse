import { BrowserRouter } from 'react-router-dom';

import { AppProvider } from './presentation/context';
import { AppRouter } from './presentation/router';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
