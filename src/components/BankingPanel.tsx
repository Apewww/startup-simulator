import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { calcCompanyValuation, calcMaxLoan } from '../systems/banking';
import { Landmark, CreditCard, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const TENOR_OPTIONS = [6, 12, 24];

function fmtCash(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

function CreditScoreBar({ score }: { score: number }) {
  const segments = 10;
  const filled = Math.round(score / segments);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: segments }, (_, i) => (
        <div key={i} className={`h-2 flex-1 rounded-sm ${i < filled ? (score > 70 ? 'bg-green' : score > 40 ? 'bg-amber' : 'bg-red') : 'bg-surface-2'}`} />
      ))}
      <span className="text-[10px] font-mono font-semibold text-ink-soft ml-1">{score}/100</span>
    </div>
  );
}

function ActiveLoanCard() {
  const loan = useGameStore(s => s.loan);
  const payLoanEarly = useGameStore(s => s.payLoanEarly);
  const cash = useGameStore(s => s.cash);

  if (!loan) return null;

  const statusColor = loan.status === 'active' ? 'text-indigo' : loan.status === 'paid' ? 'text-green' : 'text-red';
  const statusLabel = loan.status === 'active' ? 'Active' : loan.status === 'paid' ? 'Paid' : 'Defaulted';

  return (
    <div className="border border-border rounded-lg p-2 bg-surface">
      <div className="flex items-center gap-1.5 mb-1.5">
        <CreditCard className="w-3.5 h-3.5 text-indigo" />
        <h3 className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">Active Loan</h3>
        <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded font-semibold border ${statusColor} bg-soft`}>{statusLabel}</span>
      </div>
      {loan.status === 'active' && (
        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between"><span className="text-ink-soft">Principal</span><span className="font-mono">{fmtCash(loan.principal)}</span></div>
          <div className="flex justify-between"><span className="text-ink-soft">APR</span><span className="font-mono">{(loan.interestRate * 100).toFixed(0)}%</span></div>
          <div className="flex justify-between"><span className="text-ink-soft">Tenor</span><span className="font-mono">{loan.totalMonths} months</span></div>
          <div className="flex justify-between"><span className="text-ink-soft">Monthly</span><span className="font-mono text-red font-semibold">{fmtCash(loan.monthlyPayment)}</span></div>
          <div className="flex justify-between"><span className="text-ink-soft">Paid</span><span className="font-mono">{loan.monthsPaid}/{loan.totalMonths}</span></div>
          <button
            onClick={payLoanEarly}
            disabled={cash < loan.monthlyPayment}
            className="w-full mt-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-green-soft text-green border border-green/30 hover:bg-green hover:text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Pay Early
          </button>
        </div>
      )}
      {loan.status === 'paid' && (
        <div className="text-[11px] text-green font-semibold text-center py-2">Loan fully paid!</div>
      )}
      {loan.status === 'defaulted' && (
        <div className="text-[11px] text-red font-semibold text-center py-2">Loan defaulted — credit score severely impacted</div>
      )}
    </div>
  );
}

function TakeLoanForm() {
  const [amount, setAmount] = useState(5000);
  const [tenor, setTenor] = useState(6);
  const { currentUsers, creditScore, loan, takeLoan } = useGameStore();

  const valuation = calcCompanyValuation(currentUsers, 0);
  const maxLoan = calcMaxLoan(valuation, creditScore);
  const hasActiveLoan = loan?.status === 'active';

  const interestRate = 0.08 + (tenor === 12 ? 0.02 : tenor === 24 ? 0.04 : 0) - (creditScore > 80 ? 0.02 : 0);
  const monthlyPayment = Math.round(amount * (1 + interestRate) / tenor);

  return (
    <div className="border border-border rounded-lg p-2 bg-surface">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Landmark className="w-3.5 h-3.5 text-amber" />
        <h3 className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">New Loan</h3>
      </div>
      {hasActiveLoan ? (
        <div className="text-[11px] text-ink-soft text-center py-3">Pay off active loan before taking a new one</div>
      ) : (
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-[10px] text-ink-soft mb-1">
              <span>Amount</span>
              <span className="font-mono font-semibold text-ink">{fmtCash(amount)}</span>
            </div>
            <input
              type="range"
              min={1000}
              max={maxLoan}
              step={500}
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full accent-indigo"
            />
            <div className="flex justify-between text-[9px] text-ink-soft">
              <span>{fmtCash(1000)}</span>
              <span>Max: {fmtCash(maxLoan)}</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-ink-soft mb-1">Tenor</div>
            <div className="flex gap-1.5">
              {TENOR_OPTIONS.map(t => (
                <button
                  key={t}
                  onClick={() => setTenor(t)}
                  className={`flex-1 text-[11px] font-semibold px-2 py-1.5 rounded-lg border transition-colors cursor-pointer ${tenor === t ? 'bg-indigo-soft text-indigo border-indigo/30' : 'bg-surface-2 text-ink-soft border-border hover:bg-surface'}`}
                >
                  {t}mo
                </button>
              ))}
            </div>
          </div>
          <div className="bg-surface-2 rounded-lg p-1.5 text-[10px] space-y-0.5">
            <div className="flex justify-between"><span className="text-ink-soft">APR</span><span className="font-mono text-ink font-semibold">{(interestRate * 100).toFixed(0)}%</span></div>
            <div className="flex justify-between"><span className="text-ink-soft">Monthly</span><span className="font-mono text-red font-semibold">{fmtCash(monthlyPayment)}</span></div>
            <div className="flex justify-between"><span className="text-ink-soft">Total repaid</span><span className="font-mono text-ink font-semibold">{fmtCash(monthlyPayment * tenor)}</span></div>
          </div>
          <button
            onClick={() => takeLoan(amount, tenor)}
            className="w-full text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-indigo text-white hover:bg-indigo/90 transition-colors cursor-pointer"
          >
            Take Loan
          </button>
        </div>
      )}
    </div>
  );
}

export function BankingPanel() {
  const creditScore = useGameStore(s => s.creditScore);
  const currentUsers = useGameStore(s => s.currentUsers);
  const missedPaymentTicks = useGameStore(s => s.missedPaymentTicks);

  const valuation = calcCompanyValuation(currentUsers, 0);
  const maxLoan = calcMaxLoan(valuation, creditScore);

  return (
    <div className="space-y-3">
      <div className="border border-border rounded-lg p-2 bg-surface">
        <div className="flex items-center gap-1.5 mb-1">
          <Landmark className="w-3.5 h-3.5 text-amber" />
          <h3 className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">Banking</h3>
        </div>
        <div className="space-y-1.5 text-[11px]">
          <div>
            <div className="flex justify-between mb-0.5">
              <span className="text-ink-soft">Credit Score</span>
              <span className={`text-[10px] font-semibold ${creditScore > 70 ? 'text-green' : creditScore > 40 ? 'text-amber' : 'text-red'}`}>
                {creditScore > 70 ? <CheckCircle className="w-3 h-3 inline mr-0.5" /> : creditScore > 40 ? <AlertTriangle className="w-3 h-3 inline mr-0.5" /> : <XCircle className="w-3 h-3 inline mr-0.5" />}
                {creditScore}/100
              </span>
            </div>
            <CreditScoreBar score={creditScore} />
          </div>
          <div className="flex justify-between">
            <span className="text-ink-soft">Max Loan</span>
            <span className="font-mono font-semibold">{fmtCash(maxLoan)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-soft">Company Valuation</span>
            <span className="font-mono">{fmtCash(valuation)}</span>
          </div>
          {missedPaymentTicks > 0 && (
            <div className="text-[10px] text-red font-semibold mt-1">{missedPaymentTicks}/3 missed payments</div>
          )}
        </div>
      </div>

      <ActiveLoanCard />

      <TakeLoanForm />
    </div>
  );
}

export const bankingPanelMeta = { title: 'Banking', icon: <Landmark className="w-4 h-4 text-amber" />, accent: '#B7791F' };
