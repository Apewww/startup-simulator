import { useEffect } from 'react';
import { useGameStore, TICKS_PER_MONTH, getComponentsByRole } from './store/gameStore';
import type { EmployeeRole, Employee, ComponentRequirement, PlatformFeature } from './types';
import { ProductSelect } from './components/ProductSelect';
import { ServerPanel } from './components/ServerPanel';
import { getProductDef } from './data/products';
import { getComponentDef } from './data/components';
import { getTrafficStats } from './systems/traffic';
import { calcMonthlyServerCost } from './systems/server';
import { calculateRevenue } from './systems/monetization';

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

function FeatureCard({ feature }: { feature: PlatformFeature }) {
  const buildFeature = useGameStore((s) => s.buildFeature);
  const upgradeFeature = useGameStore((s) => s.upgradeFeature);
  const resources = useGameStore((s) => s.resources);
  const product = getProductDef(useGameStore((s) => s.selectedProduct) || '');
  const featDef = product?.features.find((f) => f.id === feature.id);

  const isBuilt = feature.level > 0;
  const nextLevel = feature.level + 1;
  const cost: ComponentRequirement[] = isBuilt
    ? (featDef?.requiredComponents.map((r) => ({ componentId: r.componentId, amount: r.amount * nextLevel })) || [])
    : (featDef?.requiredComponents || []);

  const canAfford = cost.every((req) => {
    const res = resources.find((r) => r.id === req.componentId);
    return res && res.quantity >= req.amount;
  });

  return (
    <div className="bg-gray-800 rounded p-4 border border-gray-700">
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="font-semibold text-white">{feature.name}</span>
          <span className="ml-2 text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-300">
            Lv.{feature.level}
          </span>
        </div>
        <span className="text-sm text-gray-400">
          {isBuilt ? `${feature.trafficGenerated} traffic` : 'Locked'}
        </span>
      </div>

      <div className="space-y-1 mb-3">
        {cost.map((req) => {
          const compDef = getComponentDef(req.componentId);
          const res = resources.find((r) => r.id === req.componentId);
          const have = res?.quantity || 0;
          const enough = have >= req.amount;
          return (
            <div key={req.componentId} className="flex items-center gap-2 text-xs">
              <span className={enough ? 'text-green-400' : 'text-red-400'}>
                {enough ? '✓' : '✗'}
              </span>
              <span className="text-gray-400">{compDef?.name || req.componentId}</span>
              <span className="font-mono text-gray-500">
                {have}/{req.amount}
              </span>
            </div>
          );
        })}
      </div>

      {isBuilt ? (
        <button
          onClick={() => upgradeFeature(feature.id)}
          disabled={!canAfford}
          className={`text-xs px-3 py-1.5 rounded transition-colors ${
            canAfford
              ? 'bg-amber-700 hover:bg-amber-600 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          Upgrade to Lv.{nextLevel}
        </button>
      ) : (
        <button
          onClick={() => buildFeature(feature.id)}
          disabled={!canAfford}
          className={`text-xs px-3 py-1.5 rounded transition-colors ${
            canAfford
              ? 'bg-blue-700 hover:bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          Build
        </button>
      )}
    </div>
  );
}

function App() {
  const { tick, isPaused, speed, cash, month, employees, resources, features, totalSalary, racks, selectedProduct, togglePause, setSpeed, incrementTick, hireEmployee } = useGameStore();

  useEffect(() => {
    if (isPaused || !selectedProduct) return;
    const interval = setInterval(incrementTick, 1000 / speed);
    return () => clearInterval(interval);
  }, [isPaused, speed, incrementTick, selectedProduct]);

  if (!selectedProduct) {
    return <ProductSelect />;
  }

  const product = getProductDef(selectedProduct);
  const trafficStats = getTrafficStats(features);
  const serverCost = racks.length > 0 ? calcMonthlyServerCost(racks) : 0;
  const revenue = racks.length > 0 || features.some(f => f.level > 0) ? calculateRevenue(trafficStats.users, features, racks) : { ads: 0, subscription: 0, total: 0, hasSubscription: false, uptimePenalty: 1 };

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
              {serverCost > 0 && (
                <span className="text-sm text-orange-400">
                  Server: {formatCash(serverCost)}/mo
                </span>
              )}
              <span className="text-sm text-cyan-400">
                Users: {trafficStats.users.toLocaleString()}
              </span>
              <span className="text-sm text-amber-400">
                RPS: {trafficStats.rps.toLocaleString()}
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

          <ServerPanel />
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

          {(totalSalary > 0 || serverCost > 0 || revenue.total > 0) && (
            <div className="text-xs bg-gray-800 rounded p-3 border border-gray-700">
              <div className="text-gray-500 mb-1">Monthly at Month {month + 1}:</div>
              <div className="text-green-400">
                Income: {formatCash(revenue.total)}
                {revenue.uptimePenalty < 1 && <span className="text-red-400 ml-1">(-50% crash penalty)</span>}
              </div>
              {revenue.ads > 0 && <div className="text-green-500 ml-2">Ads: {formatCash(revenue.ads)}</div>}
              {revenue.subscription > 0 && <div className="text-green-500 ml-2">Subscription: {formatCash(revenue.subscription)}</div>}
              {totalSalary > 0 && <div className="text-red-400">Payroll: -{formatCash(totalSalary)}</div>}
              {serverCost > 0 && <div className="text-red-400">Server: -{formatCash(serverCost)}</div>}
              <div className={`mt-1 font-medium ${(revenue.total - totalSalary - serverCost) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                Net: {formatCash(revenue.total - totalSalary - serverCost)}
              </div>
            </div>
          )}

          <div className="bg-gray-800 rounded p-4 border border-gray-700">
            <h2 className="text-lg font-semibold mb-3">
              {product?.name} — Features
            </h2>
            {features.length === 0 ? (
              <p className="text-gray-500 text-sm">No features yet.</p>
            ) : (
              <div className="space-y-3">
                {features.map((f) => (
                  <FeatureCard key={f.id} feature={f} />
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
