import { useAppStore } from '@stores/index';

function App() {
  const { isDataLoaded, lastImportTime } = useAppStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Customer Success Metrics Dashboard
          </h1>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="card">
          <p className="text-gray-600">
            {isDataLoaded
              ? `Data loaded at ${lastImportTime?.toLocaleString()}`
              : 'No data loaded yet. Import a CSV file to get started.'}
          </p>
        </div>
        <div className="mt-4 flex gap-2">
          <span className="inline-block h-4 w-4 rounded-full bg-healthy" />
          <span className="text-sm">Healthy</span>
          <span className="ml-4 inline-block h-4 w-4 rounded-full bg-at-risk" />
          <span className="text-sm">At Risk</span>
          <span className="ml-4 inline-block h-4 w-4 rounded-full bg-critical" />
          <span className="text-sm">Critical</span>
        </div>
      </main>
    </div>
  );
}

export default App;
