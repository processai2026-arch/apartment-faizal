import { useEffect, useState } from 'react';
import { Crown, CheckCircle2, AlertCircle, XCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSubscriptionStore } from '@/stores/useSubscriptionStore';
import type { SubscriptionPlan } from '@/types';
import { useToast } from '@/hooks/use-toast';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN');
}

type BillingCycle = 'Monthly' | 'Yearly';

const planColors: Record<string, { badge: string; border: string; button: string }> = {
  free: { badge: 'bg-slate-600', border: 'border-slate-700', button: 'bg-slate-700 hover:bg-slate-600' },
  premium: { badge: 'bg-indigo-600', border: 'border-indigo-600', button: 'bg-indigo-600 hover:bg-indigo-700' },
  enterprise: { badge: 'bg-purple-600', border: 'border-purple-600', button: 'bg-purple-600 hover:bg-purple-700' },
};

export default function TenantSubscription() {
  const { toast } = useToast();
  const { myPlan, mySubscription, plans, loading, loadMyPlan, requestUpgrade, cancelMyPlan } = useSubscriptionStore();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('Monthly');
  const [upgrading, setUpgrading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    void loadMyPlan();
  }, [loadMyPlan]);

  const handleUpgrade = async (plan: SubscriptionPlan) => {
    setUpgrading(true);
    try {
      const result = await requestUpgrade(plan.id, billingCycle);
      toast({
        title: 'Upgrade Request Recorded',
        description: result.message,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: (err as Error).message,
        variant: 'destructive',
      });
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;
    setCancelling(true);
    try {
      await cancelMyPlan();
      toast({ title: 'Subscription cancelled' });
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setCancelling(false);
    }
  };

  const isCurrentPlan = (plan: SubscriptionPlan) => myPlan?.id === plan.id;
  const isPaidPlan = mySubscription && mySubscription.status === 'Active';

  if (loading && !myPlan) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
          <Crown className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">My Subscription</h1>
          <p className="text-sm text-slate-400">Manage your plan and premium features</p>
        </div>
      </div>

      {/* Coming soon banner */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
        <Zap className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
        <div>
          <p className="font-medium text-amber-300">Payment Integration Coming Soon</p>
          <p className="mt-1 text-sm text-amber-200/70">
            Premium features will be fully activated with Razorpay integration in the next update.
            You can submit an upgrade request now and it will be activated once payment is live.
          </p>
        </div>
      </div>

      {/* Current Plan Card */}
      {myPlan && (
        <Card className="border-slate-700 bg-slate-800/60 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Plan</p>
              <div className="mt-1 flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white">{myPlan.name}</h2>
                <span className={`rounded-full px-3 py-1 text-xs font-bold text-white ${planColors[myPlan.slug]?.badge ?? 'bg-slate-600'}`}>
                  {myPlan.slug === 'free' ? 'Free' : 'Active'}
                </span>
              </div>
              {myPlan.description && <p className="mt-1 text-sm text-slate-400">{myPlan.description}</p>}
            </div>
            {mySubscription && (
              <div className="text-right">
                <p className="text-xs text-slate-400">Expires</p>
                <p className="font-medium text-white">{formatDate(mySubscription.expiresAt)}</p>
                <p className="mt-1 text-xs text-slate-400">{mySubscription.billingCycle}</p>
              </div>
            )}
          </div>

          {/* Features list */}
          {myPlan.features.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {myPlan.features.map((f, i) => (
                <span key={i} className="flex items-center gap-1 rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-300">
                  <CheckCircle2 className="h-3 w-3 text-green-400" /> {f}
                </span>
              ))}
            </div>
          )}

          {/* Cancel button for paid plans */}
          {isPaidPlan && myPlan.slug !== 'free' && (
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={cancelling}
                className="gap-2 border-red-800 text-red-400 hover:bg-red-900/30"
              >
                <XCircle className="h-4 w-4" />
                {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-sm ${billingCycle === 'Monthly' ? 'font-semibold text-white' : 'text-slate-400'}`}>Monthly</span>
        <button
          onClick={() => setBillingCycle(bc => bc === 'Monthly' ? 'Yearly' : 'Monthly')}
          className={`relative h-6 w-12 rounded-full transition-colors ${billingCycle === 'Yearly' ? 'bg-indigo-600' : 'bg-slate-700'}`}
        >
          <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${billingCycle === 'Yearly' ? 'left-7' : 'left-1'}`} />
        </button>
        <span className={`text-sm ${billingCycle === 'Yearly' ? 'font-semibold text-white' : 'text-slate-400'}`}>
          Yearly <span className="text-xs text-green-400">(Save ~17%)</span>
        </span>
      </div>

      {/* Plan Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const colors = planColors[plan.slug] ?? planColors.free;
          const current = isCurrentPlan(plan);
          const price = billingCycle === 'Monthly' ? plan.priceMonthly : plan.priceYearly;
          const priceLabel = billingCycle === 'Monthly' ? '/mo' : '/yr';

          return (
            <Card
              key={plan.id}
              className={`relative border-2 bg-slate-800/60 p-5 transition-all ${
                current ? `${colors.border} ring-2 ring-indigo-500/30` : 'border-slate-700'
              }`}
            >
              {current && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-bold text-white">
                  Current Plan
                </div>
              )}

              <div className="text-center">
                <div className={`mx-auto mb-2 inline-block rounded-full px-4 py-1 text-sm font-bold text-white ${colors.badge}`}>
                  {plan.name}
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-white">
                    {price === 0 ? 'Free' : formatCurrency(price)}
                  </span>
                  {price > 0 && <span className="text-sm text-slate-400">{priceLabel}</span>}
                </div>
                {plan.description && (
                  <p className="mt-1 text-xs text-slate-400">{plan.description}</p>
                )}
              </div>

              <ul className="mt-4 space-y-2">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-400" /> {f}
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex flex-wrap gap-1 justify-center">
                {plan.analyticsAccess && <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">Analytics</span>}
                {plan.featuredVendor && <span className="rounded bg-purple-500/20 px-2 py-0.5 text-xs text-purple-400">Featured Vendor</span>}
                {plan.featuredRental && <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-400">Featured Rental</span>}
                {plan.prioritySupport && <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">Priority Support</span>}
              </div>

              <div className="mt-5">
                {current ? (
                  <Button disabled className="w-full bg-slate-700 text-slate-400">
                    Current Plan
                  </Button>
                ) : plan.slug === 'free' ? (
                  <Button disabled className="w-full bg-slate-700 text-slate-400">
                    Basic Plan
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleUpgrade(plan)}
                    disabled={upgrading}
                    className={`w-full gap-2 text-white ${colors.button}`}
                  >
                    <Crown className="h-4 w-4" />
                    {upgrading ? 'Requesting...' : `Upgrade to ${plan.name}`}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Info note about pending upgrades */}
      {mySubscription?.status === 'Pending' && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400" />
          <div>
            <p className="font-medium text-blue-300">Upgrade Request Pending</p>
            <p className="mt-1 text-sm text-blue-200/70">
              Your upgrade request has been recorded. It will be activated once the payment gateway (Razorpay) is integrated.
              Reference: {mySubscription.paymentRef ?? 'PENDING'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
