import { Route, Routes } from 'react-router-dom';

import { AppLayout } from '../components/layout';
import { CustomerDetail, CustomerList, Dashboard, Import, NotFound } from '../pages';

/**
 * Application router configuration.
 * Defines all routes and their corresponding page components.
 */
export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="customers" element={<CustomerList />} />
        <Route path="customers/:customerId" element={<CustomerDetail />} />
        <Route path="import" element={<Import />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
