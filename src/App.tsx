import { useEffect } from 'react';
import { useGameStore, TICKS_PER_MONTH, getComponentsByRole } from './store/gameStore';
import type { EmployeeRole, Employee } from './types';
import { ProductSelect } from './components/ProductSelect';
import { getProductDef } from './data/products';

const ROLES: EmployeeRole[] = ['Developer', 'Designer', 'Lead_Developer', 'SysAdmin'];

function formatCash(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}

function EmployeeCard({ employee }: { employee: Employee }) {
  const assignTask = useGameStore((s) => s.assignTask);
  const availableComponents = getComponentsByRole(employee.role);

  return (
    <div className="bg-gray-800 rounded p-4 border border-gray-700">
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="font-semibold text-white">{employee.name}</span>
          <span className="ml-2 text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-300">
            {employee.role.replace('_', ' ')}
          </span>
          <span className="ml-2 text-xs text-gray-400">Lv.{employee.level}</span>
        </div>
        <span className="text-sm text-gray-400">{formatCash(employee.salary)}/mo</span>
      </div>

      {employee.currentTask ? (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{employee.currentTask.replace(/_/g, ' ')}</span>
            <span>{Math.min(100, Math.round((employee.taskProgress / 20) * 100))}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded h-2">
            <div
              className="bg-blue-500 h-2 rounded transition-all duration-300"
              style={{ width: `${Math.min(100, (employee.taskProgress / 20) * 100)}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1">
          {availableComponents.length > 0 ? (
            availableComponents.map((comp) => (
              <button
                key={comp.id}
                onClick={() => assignTask(employee.id, comp.id)}
                className="text-xs px-2 py-1 bg-gray-700 hover:bg-blue-700 rounded transition-colors"
              >
                {comp.name}
              </button>
            ))
          ) : (
            <span className="text-xs text-gray-500">No components available</span>
          )}
        </div>
      )}
    </div>
  );
}

function App() {
  const { tick, isPaused, speed, cash, month, employees, resources, features, totalSalary, selectedProduct, togglePause, setSpeed, incrementTick, hireEmployee } = useGameStore();

  useEffect(() => {
    if (isPaused || !selectedProduct) return;
    const interval = setInterval(incrementTick, 1000 / speed);
    return () => clearInterval(interval);
  }, [isPaused, speed, incrementTick, selectedProduct]);

  if (!selectedProduct) {
    return <ProductSelect />;
  }

  const product = getProductDef(selectedProduct);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-2">Startup Simulator</h1>
      <p className="text-gray-400 mb-2">{product?.name} — Build your startup from the ground up</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-800 rounded p-4 border border-gray-700">
            <div className="flex items-center gap-6 flex-wrap">
              <span className="text-lg font-mono">Tick: {tick}</span>
              <span className="text-sm text-gray-400">
                ({isPaused ? 'PAUSED' : `Running @ ${speed}x`})
              </span>
              <span className="text-2xl font-mono text-green-400">{formatCash(cash)}</span>
              <span className="text-sm text-gray-400">
                Month {month} ({(tick % TICKS_PER_MONTH)}/{TICKS_PER_MONTH} ticks)
              </span>
              <span className="text-sm text-gray-400">
                Payroll: {formatCash(totalSalary)}/mo
              </span>
              <div className="flex gap-2">
                <button onClick={togglePause} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors">
                  {isPaused ? 'Play' : 'Pause'}
                </button>
                {([1, 2, 4] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-3 py-2 rounded transition-colors ${speed === s ? 'bg-green-600 cursor-default' : 'bg-gray-700 hover:bg-gray-600'}`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">Employees ({employees.length})</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => hireEmployee(role)}
                  className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-600 rounded text-sm transition-colors"
                >
                  Hire {role.replace('_', ' ')}
                </button>
              ))}
            </div>
            {employees.length === 0 ? (
              <p className="text-gray-500 text-sm">No employees yet. Hire your first team member!</p>
            ) : (
              <div className="space-y-3">
                {employees.map((emp) => (
                  <EmployeeCard key={emp.id} employee={emp} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-800 rounded p-4 border border-gray-700">
            <h2 className="text-lg font-semibold mb-3">Inventory</h2>
            {resources.length === 0 ? (
              <p className="text-gray-500 text-sm">No components produced yet.</p>
            ) : (
              <div className="space-y-2">
                {resources.map((res) => (
                  <div key={res.id} className="flex justify-between text-sm">
                    <span className="text-gray-300">{res.name}</span>
                    <span className="font-mono text-yellow-400">{res.quantity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {totalSalary > 0 && cash > 0 && (
            <div className="text-xs text-gray-500 bg-gray-800 rounded p-3 border border-gray-700">
              Next salary deduction: Month {month + 1} ({formatCash(totalSalary)})
            </div>
          )}

          <div className="bg-gray-800 rounded p-4 border border-gray-700">
            <h2 className="text-lg font-semibold mb-3">
              {product?.name} — Features
            </h2>
            {features.length === 0 ? (
              <p className="text-gray-500 text-sm">No features yet.</p>
            ) : (
              <div className="space-y-2">
                {features.map((f) => (
                  <div key={f.id} className="flex justify-between items-center text-sm">
                    <div>
                      <span className="text-gray-300">{f.name}</span>
                      <span className="ml-2 text-xs text-gray-500">Lv.{f.level}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {f.level > 0 ? `${f.trafficGenerated} traffic` : '🔒 Locked'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
