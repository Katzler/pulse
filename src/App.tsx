import { BrowserRouter } from 'react-router-dom';

import { AppRouter } from './presentation/router';

function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;
