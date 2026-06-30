import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  CreditCard, TrendingUp, AlertTriangle, CheckCircle2,
  RefreshCw, Clock, DollarSign, BarChart3, ArrowLeft,
  ReceiptText, Banknote, Smartphone, History, X
} from 'lucide-react';
import { toast } from 'sonner';
import StatusBadge from '@/components/features/StatusBadge';
import { api } from '@/lib/api';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';
import type { Invoice, PaymentTransaction, PaymentDashboard as PaymentDashboardType, RazorpayOrder } from '@/types';

// Extend window to hold Razorpay constructor
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

// ── Razorpay checkout script loader ──────────────────────────────────────────

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window.Razorpay !== 'undefined') {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ── Razorpay Checkout component ───────────────────────────────────────────────

interface RazorpayCheckoutProps {
  invoice: Invoice;
  onSuccess: (invoice: Invoice) => void;
  onClose: () => void;
}

function RazorpayCheckout({ invoice, onSuccess, onClose }: RazorpayCheckoutProps) {
  const [loading, setLoading] = useState(false);

  const handlePay = useCallback(async () => {
    setLoading(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || typeof window.Razorpay === 'undefined') {
        toast.error('Failed to load Razorpay checkout. Please check your internet connection.');
        return;
      }

      const order: RazorpayOrder = await api.financials.createPaymentOrder(invoice.id);

      const rzpOptions: Record<string, unknown> = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: 'OfficeGate',
        description: `Invoice ${invoice.invoiceNo}`,
        notes: {
          invoice_id: invoice.id,
          invoice_no: invoice.invoiceNo,
        },
        prefill: {},
        theme: { color: '#6366f1' },
        modal: {
          ondismiss: () => {
            onClose();
          },
        },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const updated = await api.financials.verifyPayment(invoice.id, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success(`Payment successful for ${invoice.invoiceNo}`);
            onSuccess(updated);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Payment verification failed');
          }
        },
      };

      const rzp = new window.Razorpay(rzpOptions);
      rzp.open();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not initiate payment');
    } finally {
      setLoading(false);
    }
  }, [invoice, onSuccess, onClose]);

  return (
    <div className="flex flex-col gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
      <div className="flex items-center gap-2 text-indigo-700 font-medium text-sm">
        <Smartphone className="w-4 h-4" />
        Online Payment via Razorpay
      </div>
      <div className="text-sm text-slate-600">
        Invoice: <span className="font-semibold">{invoice.invoiceNo}</span>
        &nbsp;·&nbsp;Amount: <span className="font-semibold text-indigo-600">₹{(invoice.amount - invoice.paidAmount).toLocaleString()}</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handlePay}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <><RefreshCw className="w-4 h-4 animate-spin" /> Loading…</>
          ) : (
            <><CreditCard className="w-4 h-4" /> Pay Now</>
          )}
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  gradient: string;
  icon: React.ReactNode;
}

function KpiCard({ label, value, sub, gradient, icon }: KpiCardProps) {
  return (
    <div className={cn('rounded-2xl p-5 text-white shadow-lg', gradient)}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-white/80 text-sm font-medium">{label}</p>
        <div className="opacity-80">{icon}</div>
      </div>
      <p className="text-3xl font-bold font-[Outfit]">{value}</p>
      {sub && <p className="text-white/70 text-xs mt-1">{sub}</p>}
    </div>
  );
}

// ── Transaction status badge ──────────────────────────────────────────────────

function TxBadge({ status }: { status: PaymentTransaction['status'] }) {
  const map: Record<PaymentTransaction['status'], string> = {
    created:  'bg-blue-100 text-blue-700',
    paid:     'bg-green-100 text-green-700',
    failed:   'bg-red-100 text-red-700',
    refunded: 'bg-amber-100 text-amber-700',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize', map[status] ?? 'bg-slate-100 text-slate-600')}>
      {status}
    </span>
  );
}

// ── Payment History Modal ─────────────────────────────────────────────────────

interface PaymentHistoryModalProps {
  invoiceId: string;
  invoiceNo: string;
  onClose: () => void;
}

function PaymentHistoryModal({ invoiceId, invoiceNo, onClose }: PaymentHistoryModalProps) {
  const [txns, setTxns] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.financials.paymentHistory(invoiceId)
      .then(setTxns)
      .catch(() => toast.error('Could not load payment history'))
      .finally(() => setLoading(false));
  }, [invoiceId]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold font-[Outfit] flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-500" />
            Payment History — {invoiceNo}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
        </div>
        {loading ? (
          <div className="py-8 text-center text-slate-400">Loading…</div>
        ) : txns.length === 0 ? (
          <div className="py-8 text-center text-slate-400">No payment transactions found</div>
        ) : (
          <div className="space-y-3">
            {txns.map((tx) => (
              <div key={tx.id} className="border border-slate-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-slate-800 text-sm">₹{tx.amount.toLocaleString()} {tx.currency}</span>
                  <TxBadge status={tx.status} />
                </div>
                <div className="text-xs text-slate-500 space-y-1">
                  {tx.razorpayOrderId && <div>Order: <span className="font-mono">{tx.razorpayOrderId}</span></div>}
                  {tx.razorpayPaymentId && <div>Payment: <span className="font-mono">{tx.razorpayPaymentId}</span></div>}
                  {tx.errorDescription && <div className="text-red-500">Error: {tx.errorDescription}</div>}
                  <div>{tx.createdAt ? new Date(tx.createdAt).toLocaleString('en-IN') : '—'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

type ActiveTab = 'dashboard' | 'invoices' | 'transactions';

export default function PaymentDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedInvoiceId = searchParams.get('invoice');

  const { invoices, loadAdminInvoices } = useAppStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [dashboard, setDashboard] = useState<PaymentDashboardType | null>(null);
  const [dashLoading, setDashLoading] = useState(false);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null);
  const [historyInvoice, setHistoryInvoice] = useState<Invoice | null>(null);
  const [refunding, setRefunding] = useState<string | null>(null);
  const [allTxns, setAllTxns] = useState<PaymentTransaction[]>([]);
  const [txFilter, setTxFilter] = useState('');
  const txnsLoaded = useRef(false);

  const razorpayMode = (import.meta.env.VITE_RAZORPAY_MODE ?? 'test') as string;

  const loadDashboard = useCallback(() => {
    setDashLoading(true);
    api.financials.paymentDashboard()
      .then(setDashboard)
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Could not load dashboard'))
      .finally(() => setDashLoading(false));
  }, []);

  const loadInvoices = useCallback(() => {
    setInvoicesLoading(true);
    loadAdminInvoices().finally(() => setInvoicesLoading(false));
  }, [loadAdminInvoices]);

  useEffect(() => {
    loadDashboard();
    loadInvoices();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select invoice from query param
  useEffect(() => {
    if (preselectedInvoiceId && invoices.length > 0) {
      const found = invoices.find((i) => i.id === preselectedInvoiceId);
      if (found) {
        setSelectedInvoice(found);
        setActiveTab('invoices');
        if (found.status !== 'Paid' && found.status !== 'Cancelled') {
          setPayInvoice(found);
        }
      }
    }
  }, [preselectedInvoiceId, invoices]);

  // Load all transactions when switching to transactions tab
  useEffect(() => {
    if (activeTab === 'transactions' && !txnsLoaded.current && dashboard) {
      setAllTxns(dashboard.recentTransactions);
      txnsLoaded.current = true;
    }
  }, [activeTab, dashboard]);

  const handlePaymentSuccess = useCallback((updated: Invoice) => {
    setPayInvoice(null);
    // Reload
    loadInvoices();
    loadDashboard();
    // Update selected
    if (selectedInvoice?.id === updated.id) setSelectedInvoice(updated);
  }, [selectedInvoice, loadInvoices, loadDashboard]);

  const handleRefund = useCallback(async (invoice: Invoice) => {
    if (!confirm(`Initiate refund for invoice ${invoice.invoiceNo}? This will refund ₹${invoice.amount.toLocaleString()} back to the payer.`)) return;
    setRefunding(invoice.id);
    try {
      await api.financials.refund(invoice.id);
      toast.success('Refund initiated successfully');
      loadInvoices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not initiate refund');
    } finally {
      setRefunding(null);
    }
  }, [loadInvoices]);

  const filteredInvoices = invoices.filter((inv) => {
    if (filterStatus && inv.status !== filterStatus) return false;
    return true;
  });

  const filteredTxns = allTxns.filter((tx) => {
    if (!txFilter) return true;
    return (
      tx.status === txFilter ||
      (tx.paymentMethod ?? '').toLowerCase().includes(txFilter.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Test mode banner */}
      {razorpayMode !== 'live' && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>
            <strong>Test Mode</strong> — using Razorpay sandbox. No real payments will be charged.
            Switch <code className="bg-amber-100 px-1 rounded">RAZORPAY_MODE=live</code> in <code className="bg-amber-100 px-1 rounded">.env</code> for production.
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/financials')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold font-[Outfit] text-slate-900">Payment Dashboard</h1>
            <p className="text-sm text-slate-500">Razorpay integration — invoice payments & transactions</p>
          </div>
        </div>
        <button
          onClick={() => { loadDashboard(); loadInvoices(); }}
          disabled={dashLoading}
          className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className={cn('w-4 h-4', dashLoading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['dashboard', 'invoices', 'transactions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize',
              activeTab === tab
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {tab === 'dashboard' && <BarChart3 className="w-4 h-4 inline mr-1.5" />}
            {tab === 'invoices' && <ReceiptText className="w-4 h-4 inline mr-1.5" />}
            {tab === 'transactions' && <CreditCard className="w-4 h-4 inline mr-1.5" />}
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab: Dashboard ─────────────────────────────────────────────────── */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {dashLoading ? (
            <div className="py-12 text-center text-slate-400">Loading dashboard…</div>
          ) : !dashboard ? null : (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  label="Total Invoiced"
                  value={`₹${dashboard.totalInvoiced.toLocaleString()}`}
                  gradient="bg-gradient-to-br from-slate-700 to-slate-900"
                  icon={<DollarSign className="w-5 h-5" />}
                />
                <KpiCard
                  label="Total Paid"
                  value={`₹${dashboard.totalPaid.toLocaleString()}`}
                  gradient="bg-gradient-to-br from-green-500 to-emerald-600"
                  icon={<CheckCircle2 className="w-5 h-5" />}
                />
                <KpiCard
                  label="Total Pending"
                  value={`₹${dashboard.totalPending.toLocaleString()}`}
                  gradient="bg-gradient-to-br from-amber-500 to-orange-500"
                  icon={<Clock className="w-5 h-5" />}
                />
                <KpiCard
                  label="Total Overdue"
                  value={`₹${dashboard.totalOverdue.toLocaleString()}`}
                  gradient="bg-gradient-to-br from-red-500 to-rose-600"
                  icon={<AlertTriangle className="w-5 h-5" />}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <KpiCard
                  label="Today's Collections"
                  value={`₹${dashboard.todayPayments.toLocaleString()}`}
                  sub="invoices paid today"
                  gradient="bg-gradient-to-br from-indigo-500 to-purple-600"
                  icon={<TrendingUp className="w-5 h-5" />}
                />
                <KpiCard
                  label="This Month Revenue"
                  value={`₹${dashboard.thisMonthRevenue.toLocaleString()}`}
                  sub="current month"
                  gradient="bg-gradient-to-br from-teal-500 to-cyan-600"
                  icon={<Banknote className="w-5 h-5" />}
                />
              </div>

              {/* Payment Methods breakdown */}
              {Object.keys(dashboard.paymentMethods).length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-slate-700 mb-4">Payment Methods</h3>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(dashboard.paymentMethods).map(([method, count]) => (
                      <div key={method} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                        <CreditCard className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm font-medium text-slate-700 capitalize">{method || 'Unknown'}</span>
                        <span className="text-xs text-slate-400 bg-slate-200 rounded-full px-2">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Transactions */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-700">Recent Transactions</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Invoice</th>
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Amount</th>
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Method</th>
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {dashboard.recentTransactions.length === 0 ? (
                        <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No transactions yet</td></tr>
                      ) : (
                        dashboard.recentTransactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-medium text-slate-800">{tx.invoiceNo ?? `#${tx.invoiceId}`}</td>
                            <td className="px-4 py-3 text-indigo-600 font-medium">₹{tx.amount.toLocaleString()}</td>
                            <td className="px-4 py-3 text-slate-500 capitalize">{tx.paymentMethod ?? '—'}</td>
                            <td className="px-4 py-3"><TxBadge status={tx.status} /></td>
                            <td className="px-4 py-3 text-slate-400 text-xs">{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Tab: Invoices ──────────────────────────────────────────────────── */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Inline Razorpay checkout */}
          {payInvoice && (
            <RazorpayCheckout
              invoice={payInvoice}
              onSuccess={handlePaymentSuccess}
              onClose={() => setPayInvoice(null)}
            />
          )}

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              {invoicesLoading && <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Invoice</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Amount</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Payment</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Due Date</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredInvoices.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No invoices found</td></tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const isPaid = inv.status === 'Paid';
                      const isCancelled = inv.status === 'Cancelled';
                      const outstanding = Math.max(0, inv.amount - inv.paidAmount);
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900">{inv.invoiceNo}</div>
                            {inv.description && <div className="text-xs text-slate-400">{inv.description}</div>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-indigo-600">₹{inv.amount.toLocaleString()}</div>
                            {inv.paidAmount > 0 && inv.paidAmount < inv.amount && (
                              <div className="text-xs text-green-600">₹{inv.paidAmount.toLocaleString()} paid</div>
                            )}
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                          <td className="px-4 py-3">
                            {inv.paymentMethod ? (
                              <span className="text-xs text-slate-500 capitalize">{inv.paymentMethod}</span>
                            ) : (
                              <span className="text-xs text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">
                            {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              {!isPaid && !isCancelled && outstanding > 0 && (
                                <button
                                  onClick={() => setPayInvoice(inv)}
                                  className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors"
                                >
                                  <CreditCard className="w-3.5 h-3.5" /> Pay Online
                                </button>
                              )}
                              {isPaid && inv.razorpayPaymentId && (
                                <button
                                  onClick={() => handleRefund(inv)}
                                  disabled={refunding === inv.id || inv.refundStatus === 'Pending' || inv.refundStatus === 'Processed'}
                                  className="flex items-center gap-1.5 bg-amber-50 text-amber-600 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-100 disabled:opacity-50 transition-colors"
                                >
                                  {refunding === inv.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                  {inv.refundStatus === 'Pending' ? 'Refund Pending' : inv.refundStatus === 'Processed' ? 'Refunded' : 'Refund'}
                                </button>
                              )}
                              <button
                                onClick={() => setHistoryInvoice(inv)}
                                className="flex items-center gap-1.5 bg-slate-50 text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors"
                              >
                                <History className="w-3.5 h-3.5" /> History
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Transactions ─────────────────────────────────────────────── */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
            <select
              value={txFilter}
              onChange={(e) => setTxFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Status</option>
              <option value="created">Created</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Invoice</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Order ID</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Amount</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Method</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredTxns.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No transactions found</td></tr>
                ) : (
                  filteredTxns.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-800">{tx.invoiceNo ?? `#${tx.invoiceId}`}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{tx.razorpayOrderId ?? '—'}</td>
                      <td className="px-4 py-3 font-medium text-indigo-600">₹{tx.amount.toLocaleString()}</td>
                      <td className="px-4 py-3"><TxBadge status={tx.status} /></td>
                      <td className="px-4 py-3 text-slate-500 capitalize text-xs">{tx.paymentMethod ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{tx.createdAt ? new Date(tx.createdAt).toLocaleString('en-IN') : '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {historyInvoice && (
        <PaymentHistoryModal
          invoiceId={historyInvoice.id}
          invoiceNo={historyInvoice.invoiceNo}
          onClose={() => setHistoryInvoice(null)}
        />
      )}
    </div>
  );
}
