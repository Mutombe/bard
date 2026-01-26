"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  FileText,
  Bell,
  BarChart3,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Subscription {
  id: string;
  plan: {
    name: string;
    planType: string;
    priceUsd: number;
    billingCycle: string;
  };
  status: "active" | "trialing" | "past_due" | "canceled" | "expired";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndDate?: string;
  canceledAt?: string;
  autoRenew: boolean;
  usage: {
    articlesRead: number;
    articlesLimit: number;
    apiCalls: number;
    apiCallsLimit: number;
  };
}

interface PaymentMethod {
  id: string;
  cardBrand: string;
  cardLastFour: string;
  cardExpMonth: number;
  cardExpYear: number;
  isDefault: boolean;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  total: number;
  currency: string;
  status: string;
  issueDate: string;
  pdfUrl?: string;
}

interface SubscriptionManagerProps {
  subscription: Subscription | null;
  paymentMethods: PaymentMethod[];
  invoices: Invoice[];
  onUpgrade: () => void;
  onCancel: (reason: string) => Promise<void>;
  onResume: () => Promise<void>;
  onManagePaymentMethods: () => void;
  className?: string;
}

export function SubscriptionManager({
  subscription,
  paymentMethods,
  invoices,
  onUpgrade,
  onCancel,
  onResume,
  onManagePaymentMethods,
  className,
}: SubscriptionManagerProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCanceling, setIsCanceling] = useState(false);

  const handleCancel = async () => {
    setIsCanceling(true);
    try {
      await onCancel(cancelReason);
      setShowCancelDialog(false);
    } finally {
      setIsCanceling(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return {
          icon: CheckCircle,
          label: "Active",
          color: "text-green-500",
          bg: "bg-green-500/10",
        };
      case "trialing":
        return {
          icon: Bell,
          label: "Trial",
          color: "text-blue-500",
          bg: "bg-blue-500/10",
        };
      case "past_due":
        return {
          icon: AlertTriangle,
          label: "Past Due",
          color: "text-amber-500",
          bg: "bg-amber-500/10",
        };
      case "canceled":
        return {
          icon: XCircle,
          label: "Canceled",
          color: "text-red-500",
          bg: "bg-red-500/10",
        };
      default:
        return {
          icon: AlertTriangle,
          label: "Unknown",
          color: "text-muted-foreground",
          bg: "bg-muted",
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const defaultPaymentMethod = paymentMethods.find((pm) => pm.isDefault);

  if (!subscription) {
    return (
      <div className={cn("card-terminal p-8 text-center", className)}>
        <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Active Subscription</h3>
        <p className="text-muted-foreground mb-6">
          Upgrade to access premium features and unlimited content.
        </p>
        <Button onClick={onUpgrade}>View Plans</Button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(subscription.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Current Plan Card */}
      <div className="card-terminal p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Current Plan</div>
            <h2 className="text-2xl font-bold">{subscription.plan.name}</h2>
          </div>
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
            statusConfig.bg,
            statusConfig.color
          )}>
            <StatusIcon className="h-4 w-4" />
            {statusConfig.label}
          </div>
        </div>

        {/* Billing Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-terminal-elevated rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Current Period</span>
            </div>
            <div className="font-medium">
              {formatDate(subscription.currentPeriodStart)} -{" "}
              {formatDate(subscription.currentPeriodEnd)}
            </div>
          </div>

          <div className="p-4 bg-terminal-elevated rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <CreditCard className="h-4 w-4" />
              <span className="text-sm">Next Billing</span>
            </div>
            <div className="font-medium">
              {subscription.autoRenew ? (
                <>
                  ${(subscription.plan.priceUsd / 100).toFixed(2)} on{" "}
                  {formatDate(subscription.currentPeriodEnd)}
                </>
              ) : (
                <span className="text-muted-foreground">
                  Subscription ends {formatDate(subscription.currentPeriodEnd)}
                </span>
              )}
            </div>
          </div>

          <div className="p-4 bg-terminal-elevated rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <RefreshCw className="h-4 w-4" />
              <span className="text-sm">Auto Renew</span>
            </div>
            <div className={cn(
              "font-medium",
              subscription.autoRenew ? "text-green-500" : "text-muted-foreground"
            )}>
              {subscription.autoRenew ? "Enabled" : "Disabled"}
            </div>
          </div>
        </div>

        {/* Trial Banner */}
        {subscription.status === "trialing" && subscription.trialEndDate && (
          <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-6">
            <Bell className="h-5 w-5 text-blue-500" />
            <div>
              <div className="font-medium text-blue-500">Trial Period Active</div>
              <div className="text-sm text-muted-foreground">
                Your trial ends on {formatDate(subscription.trialEndDate)}.
                Add a payment method to continue after the trial.
              </div>
            </div>
          </div>
        )}

        {/* Past Due Banner */}
        {subscription.status === "past_due" && (
          <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-6">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div>
              <div className="font-medium text-amber-500">Payment Failed</div>
              <div className="text-sm text-muted-foreground">
                Please update your payment method to avoid service interruption.
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={onManagePaymentMethods}
            >
              Update Payment
            </Button>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={onUpgrade}>
            {subscription.plan.planType === "enterprise"
              ? "Contact Sales"
              : "Upgrade Plan"}
          </Button>

          {subscription.status === "canceled" && !subscription.autoRenew ? (
            <Button variant="outline" onClick={onResume}>
              Resume Subscription
            </Button>
          ) : subscription.status !== "canceled" && (
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="text-muted-foreground">
                  Cancel Subscription
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel Subscription</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to cancel? You&apos;ll still have access
                    until {formatDate(subscription.currentPeriodEnd)}.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="text-sm text-muted-foreground">
                    Help us improve - why are you canceling?
                  </div>
                  <select
                    className="w-full p-2 rounded-lg bg-terminal-elevated border border-border"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  >
                    <option value="">Select a reason...</option>
                    <option value="too_expensive">Too expensive</option>
                    <option value="missing_features">Missing features</option>
                    <option value="not_using">Not using enough</option>
                    <option value="found_alternative">Found an alternative</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <DialogFooter>
                  <Button
                    variant="ghost"
                    onClick={() => setShowCancelDialog(false)}
                  >
                    Keep Subscription
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancel}
                    disabled={isCanceling}
                  >
                    {isCanceling ? "Canceling..." : "Cancel Subscription"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Usage Stats */}
      <div className="card-terminal p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Usage This Period
        </h3>

        <div className="space-y-4">
          <UsageBar
            label="Premium Articles"
            current={subscription.usage.articlesRead}
            limit={subscription.usage.articlesLimit}
          />
          <UsageBar
            label="API Calls"
            current={subscription.usage.apiCalls}
            limit={subscription.usage.apiCallsLimit}
          />
        </div>
      </div>

      {/* Payment Method */}
      {defaultPaymentMethod && (
        <div className="card-terminal p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Method
            </h3>
            <Button variant="ghost" size="sm" onClick={onManagePaymentMethods}>
              Manage
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="p-2 bg-terminal-elevated rounded-lg">
              <CreditCard className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <div className="font-medium">
                {defaultPaymentMethod.cardBrand} •••• {defaultPaymentMethod.cardLastFour}
              </div>
              <div className="text-sm text-muted-foreground">
                Expires {defaultPaymentMethod.cardExpMonth}/
                {defaultPaymentMethod.cardExpYear}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Invoices */}
      {invoices.length > 0 && (
        <div className="card-terminal p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Invoices
          </h3>

          <div className="divide-y divide-border">
            {invoices.slice(0, 5).map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <div className="font-medium font-mono">
                    {invoice.invoiceNumber}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(invoice.issueDate)}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-mono">
                      ${(invoice.total / 100).toFixed(2)}
                    </div>
                    <div className={cn(
                      "text-xs",
                      invoice.status === "paid" ? "text-green-500" : "text-muted-foreground"
                    )}>
                      {invoice.status}
                    </div>
                  </div>
                  {invoice.pdfUrl && (
                    <a
                      href={invoice.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface UsageBarProps {
  label: string;
  current: number;
  limit: number;
}

function UsageBar({ label, current, limit }: UsageBarProps) {
  const isUnlimited = limit === 0;
  const percentage = isUnlimited ? 0 : Math.min(100, (current / limit) * 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm">{label}</span>
        <span className="text-sm font-mono">
          {current.toLocaleString()}
          {!isUnlimited && (
            <span className="text-muted-foreground">
              {" "}/ {limit.toLocaleString()}
            </span>
          )}
          {isUnlimited && (
            <span className="text-muted-foreground"> (unlimited)</span>
          )}
        </span>
      </div>

      {!isUnlimited && (
        <div className="h-2 bg-terminal-elevated rounded-full overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full",
              isAtLimit
                ? "bg-red-500"
                : isNearLimit
                ? "bg-amber-500"
                : "bg-primary"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      )}
    </div>
  );
}
