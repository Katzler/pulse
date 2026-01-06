import { useParams } from 'react-router-dom';

/**
 * Customer detail page - individual customer view.
 * Placeholder for Phase 6 implementation.
 */
export function CustomerDetail() {
  const { customerId } = useParams<{ customerId: string }>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customer Details</h1>
        <p className="text-gray-600">Customer ID: {customerId}</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-500">Customer details coming in Phase 6</p>
      </div>
    </div>
  );
}
