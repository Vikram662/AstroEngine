"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { 
  CreditCard, 
  Wallet, 
  CheckCircle2, 
  Zap, 
  Download, 
  ShieldCheck,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  FileText,
  Check,
  X
} from "lucide-react";

interface WalletTier {
  id?: string;
  amount: number;
  credits: number;
  label: string;
  isPopular?: boolean;
}

interface SubscriptionPlanData {
  id: string;
  tier: "STARTER" | "PRO" | "ENTERPRISE";
  name: string;
  priceMonthly: number;
  includedQuota: number;
  rateLimitPerMin: number;
  features: string[];
  isPopular?: boolean;
}

export default function BillingPage() {
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [currentPlanTier, setCurrentPlanTier] = useState<string>("STARTER");
  const [currentQuota, setCurrentQuota] = useState<number>(35000);
  const [tiers, setTiers] = useState<WalletTier[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlanData[]>([]);

  const [selectedTier, setSelectedTier] = useState(2000);
  const [isProcessing, setIsProcessing] = useState(false);
  const [subscribingTier, setSubscribingTier] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  const [activeAddons, setActiveAddons] = useState<string[]>([]);
  const [togglingAddon, setTogglingAddon] = useState<string | null>(null);
  const [selectedAddonForPurchase, setSelectedAddonForPurchase] = useState<any | null>(null);
  const [purchasingAddonMethod, setPurchasingAddonMethod] = useState<string | null>(null);

  const [userSubscription, setUserSubscription] = useState<{ currentPeriodEnd?: string } | null>(null);

  const fetchAddons = () => {
    axios.get("/api/user/addons")
      .then(res => {
        if (res.data?.catalog) {
          setAddons(res.data.catalog);
          setActiveAddons(res.data.activeAddons || []);
        }
      })
      .catch(() => {});
  };

  const fetchUserData = () => {
    fetchAddons();
    // Fetch live user balance, current plan, and active subscription cycle
    axios.get("/api/user/me")
      .then(res => {
        if (res.data?.data) {
          setWalletBalance(res.data.data.walletBalance || 0);
          setCurrentPlanTier(res.data.data.planTier || "STARTER");
          setCurrentQuota(res.data.data.monthlyQuota || 35000);
          setUserSubscription(res.data.data.subscription || null);
        }
      })
      .catch(() => {});

    // Fetch user transaction history from database
    axios.get("/api/billing/recharge")
      .then(res => {
        if (res.data?.transactions) {
          setTransactions(res.data.transactions.map((t: any) => ({
            id: t.id,
            orderId: t.gatewayOrderId || t.id.substring(0, 10),
            amount: t.amount,
            creditsAdded: t.creditsAdded,
            date: new Date(t.createdAt).toLocaleString(),
            status: t.status
          })));
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchUserData();

    // Fetch live recharge tiers from database
    axios.get("/api/billing/tiers")
      .then(res => {
        if (res.data?.data && res.data.data.length > 0) {
          setTiers(res.data.data);
        }
      })
      .catch(() => {});

    // Fetch live subscription plans from database
    axios.get("/api/plans")
      .then(res => {
        if (res.data?.data && res.data.data.length > 0) {
          setPlans(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<SubscriptionPlanData | null>(null);

  const openUpgradeModal = (plan: SubscriptionPlanData) => {
    if (plan.tier === "STARTER" || plan.priceMonthly === 0) {
      // Free plan switches directly
      executeUpgrade(plan.tier, "WALLET");
    } else {
      setSelectedPlanForUpgrade(plan);
    }
  };

  const executeUpgrade = async (tier: "STARTER" | "PRO" | "ENTERPRISE", method: "WALLET" | "GATEWAY") => {
    setSubscribingTier(tier);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (method === "GATEWAY") {
        // Step 1: Create real payment order & retrieve Razorpay Key from DB
        const currentPlanObj = plans.find(p => p.tier === currentPlanTier);
        const currentPlanCost = currentPlanObj?.priceMonthly || 0;
        let unusedDays = 0;
        let creditDiscount = 0;
        if (userSubscription?.currentPeriodEnd && currentPlanCost > 0) {
          const diffTime = new Date(userSubscription.currentPeriodEnd).getTime() - new Date().getTime();
          unusedDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
          if (unusedDays > 0 && unusedDays <= 30) {
            creditDiscount = Math.round((currentPlanCost / 30) * unusedDays * 100) / 100;
          }
        }
        const netPayable = Math.max(0, Math.round(((selectedPlanForUpgrade?.priceMonthly || 0) - creditDiscount) * 100) / 100);

        const orderRes = await axios.post("/api/billing/recharge", {
          action: "create_order",
          amount: netPayable
        });

        const { orderId, key, amount, currency } = orderRes.data;

        // Check if Razorpay SDK script is loaded
        if (typeof window !== "undefined" && (window as any).Razorpay) {
          const options = {
            key: key || "rzp_test_mock_enterprise_key",
            amount: Math.round(amount * 100), // in paise
            currency: currency || "INR",
            name: "AstroEngine Cloud",
            description: `Upgrade to ${tier} Subscription Plan`,
            order_id: orderId,
            handler: async function (response: any) {
              try {
                // Settle and verify upgrade via Gateway only AFTER successful user payment
                const res = await axios.post("/api/billing/subscribe", { 
                  planTier: tier,
                  paymentMethod: "GATEWAY",
                  gatewayOrderId: response.razorpay_order_id || orderId,
                  gatewayPaymentId: response.razorpay_payment_id
                });

                if (res.data?.status === "success") {
                  setSuccessMessage(res.data.message || `Subscribed to ${tier} plan successfully via Gateway!`);
                  setSelectedPlanForUpgrade(null);
                  fetchUserData();
                } else {
                  setErrorMessage(res.data?.message || "Payment verified but subscription activation failed.");
                }
              } catch (subErr: any) {
                setErrorMessage(subErr.response?.data?.message || "Failed to confirm subscription.");
              } finally {
                setSubscribingTier(null);
              }
            },
            prefill: {
              name: "Developer",
              email: "dev@client.com"
            },
            theme: {
              color: "#0f172a"
            },
            modal: {
              ondismiss: function () {
                setSubscribingTier(null);
                setErrorMessage("Payment checkout cancelled by user.");
              }
            }
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
          return;
        } else {
          // If popup is blocked or script failed to load
          setErrorMessage("Razorpay Checkout SDK is still loading. Please try again in a few moments.");
          setSubscribingTier(null);
          return;
        }
      } else {
        // Pay using live Wallet Balance
        const res = await axios.post("/api/billing/subscribe", { 
          planTier: tier,
          paymentMethod: "WALLET"
        });

        if (res.data?.status === "success") {
          setSuccessMessage(res.data.message || `Subscribed to ${tier} plan successfully from Wallet!`);
          setSelectedPlanForUpgrade(null);
          fetchUserData();
        } else {
          setErrorMessage(res.data?.message || "Failed to upgrade plan.");
        }
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(error.response?.data?.message || error.message || "Failed to subscribe to plan.");
    } finally {
      if (method === "WALLET") {
        setSubscribingTier(null);
      }
    }
  };

  const handleRecharge = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Step 1: Initialize Payment Order
      const orderRes = await axios.post("/api/billing/recharge", {
        action: "create_order",
        amount: selectedTier
      });

      const { orderId, key, amount, currency } = orderRes.data;

      // Launch real Razorpay popup checkout
      if (typeof window !== "undefined" && (window as any).Razorpay) {
        const options = {
          key: key || "rzp_test_mock_enterprise_key",
          amount: Math.round(amount * 100),
          currency: currency || "INR",
          name: "AstroEngine Cloud",
          description: `Prepaid Wallet Recharge ₹${selectedTier}`,
          order_id: orderId,
          handler: async function (response: any) {
            try {
              // Complete and verify payment transaction only AFTER user completes payment
              const verifyRes = await axios.post("/api/billing/recharge", {
                action: "verify_and_credit",
                amount: selectedTier,
                orderId: response.razorpay_order_id || orderId,
                gatewayPaymentId: response.razorpay_payment_id
              });

              if (verifyRes.data.status === "success") {
                fetchUserData();
                setSuccessMessage(verifyRes.data.message || "Recharge successful! Credits added to your wallet.");
              } else {
                setErrorMessage("Payment verification failed.");
              }
            } catch (vErr: any) {
              setErrorMessage(vErr.response?.data?.message || "Payment verification failed.");
            } finally {
              setIsProcessing(false);
            }
          },
          prefill: {
            name: "Developer",
            email: "dev@client.com"
          },
          theme: {
            color: "#0f172a"
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
              setErrorMessage("Recharge checkout cancelled by user.");
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        return;
      } else {
        setErrorMessage("Razorpay Checkout SDK is still loading. Please refresh and try again.");
        setIsProcessing(false);
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMessage(error.message || "Failed to process recharge transaction.");
      setIsProcessing(false);
    }
  };

  const handleCancelAddon = async (addon: any) => {
    setTogglingAddon(addon.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await axios.post("/api/user/addons", {
        addonId: addon.id,
        action: "deactivate"
      });

      if (res.data?.status === "success") {
        setSuccessMessage(res.data.message);
        fetchUserData();
      } else {
        setErrorMessage(res.data?.message || "Failed to cancel addon.");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(error.response?.data?.message || error.message || "Failed to cancel addon.");
    } finally {
      setTogglingAddon(null);
    }
  };

  const executeAddonPurchase = async (addon: any, method: "WALLET" | "GATEWAY") => {
    setPurchasingAddonMethod(method);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (method === "GATEWAY") {
        const orderRes = await axios.post("/api/billing/recharge", {
          action: "create_order",
          amount: addon.priceMonthly
        });

        const { orderId, key, amount, currency } = orderRes.data;

        if (typeof window !== "undefined" && (window as any).Razorpay) {
          const options = {
            key: key || "rzp_test_mock_enterprise_key",
            amount: Math.round(amount * 100),
            currency: currency || "INR",
            name: "AstroEngine Cloud",
            description: `Activate ${addon.name} Add-on`,
            order_id: orderId,
            handler: async function (response: any) {
              try {
                const res = await axios.post("/api/user/addons", {
                  addonId: addon.id,
                  action: "activate",
                  paymentMethod: "GATEWAY",
                  gatewayOrderId: response.razorpay_order_id || orderId,
                  gatewayPaymentId: response.razorpay_payment_id
                });

                if (res.data?.status === "success") {
                  setSuccessMessage(res.data.message);
                  setSelectedAddonForPurchase(null);
                  fetchUserData();
                } else {
                  setErrorMessage(res.data?.message || "Payment verified but addon activation failed.");
                }
              } catch (subErr: any) {
                setErrorMessage(subErr.response?.data?.message || "Failed to confirm addon activation.");
              } finally {
                setPurchasingAddonMethod(null);
              }
            },
            prefill: {
              name: "Developer",
              email: "dev@client.com"
            },
            theme: {
              color: "#0f172a"
            },
            modal: {
              ondismiss: function () {
                setPurchasingAddonMethod(null);
                setErrorMessage("Payment checkout cancelled by user.");
              }
            }
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
          return;
        } else {
          setErrorMessage("Razorpay Checkout SDK is still loading. Please try again in a few moments.");
          setPurchasingAddonMethod(null);
          return;
        }
      } else {
        // Pay from Wallet balance
        const res = await axios.post("/api/user/addons", {
          addonId: addon.id,
          action: "activate",
          paymentMethod: "WALLET"
        });

        if (res.data?.status === "success") {
          setSuccessMessage(res.data.message);
          setSelectedAddonForPurchase(null);
          fetchUserData();
        } else {
          setErrorMessage(res.data?.message || "Failed to activate addon.");
        }
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(error.response?.data?.message || error.message || "Failed to activate addon.");
    } finally {
      if (method === "WALLET") {
        setPurchasingAddonMethod(null);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Wallet & Dynamic Billing</h1>
        <p className="text-slate-600 text-xs sm:text-sm mt-1">
          Top up prepaid balance for high-throughput API calls and white-label PDF generation beyond plan quota.
        </p>
      </div>

      {/* Live Alerts */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2 shadow-sm font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2 shadow-sm font-semibold">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Dynamic Wallet Balance Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Prepaid Balance</span>
          <div className="text-3xl font-extrabold text-slate-900 font-mono mt-1">₹{walletBalance.toFixed(2)}</div>
          <div className="text-xs text-slate-500 mt-1">Automatic deduction: ₹0.02 / call after plan exhaustion</div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Webhook Verified Auto-Credit (§12.2)</span>
        </div>
      </div>

      {/* Current Subscription Plan & Upgrade Section (§8.2.6) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Subscription</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-900 text-white">
                {currentPlanTier} PLAN
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Monthly Quota: <strong className="text-slate-800">{currentQuota.toLocaleString()} calls/month</strong>. Upgrade anytime with automated Razorpay recurring mandates.
            </p>
          </div>
          <Link
            href="/pricing"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Compare all features</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Subscription Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((p) => {
            const isCurrent = p.tier === currentPlanTier;
            return (
              <div
                key={p.id}
                className={`p-5 rounded-xl border flex flex-col justify-between transition relative ${
                  isCurrent
                    ? "bg-slate-50 border-slate-900 ring-2 ring-slate-900"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                {p.isPopular && !isCurrent && (
                  <span className="absolute -top-2.5 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-600 text-white">
                    Recommended
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute -top-2.5 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-600 text-white flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Active Plan
                  </span>
                )}

                <div>
                  <h3 className="font-bold text-sm text-slate-900">{p.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-black font-mono text-slate-900">₹{p.priceMonthly.toLocaleString()}</span>
                    <span className="text-[11px] text-slate-500">/month</span>
                  </div>

                  {/* Quota & Limits Box */}
                  <div className="mt-2.5 py-2 px-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] font-mono text-slate-700 space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Monthly Quota:</span>
                      <strong className="text-slate-900">{p.includedQuota.toLocaleString()} calls</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Rate Limit:</span>
                      <strong className="text-slate-900">{p.rateLimitPerMin} RPM</strong>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="mt-3.5 space-y-1.5 text-xs text-slate-700">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Included in this Plan:
                    </div>
                    {(Array.isArray(p.features) ? p.features : []).map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-1.5 text-[11px] leading-tight text-slate-700">
                        <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => openUpgradeModal(p)}
                    disabled={isCurrent || subscribingTier === p.tier}
                    className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      isCurrent
                        ? "bg-slate-200 text-slate-500 cursor-default"
                        : "bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                    }`}
                  >
                    {subscribingTier === p.tier ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : isCurrent ? (
                      "Current Plan"
                    ) : (
                      `Upgrade to ${p.name}`
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recharge Packs */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Select Recharge Amount (INR)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tiers.map((tier) => (
            <div
              key={tier.amount}
              onClick={() => setSelectedTier(tier.amount)}
              className={`p-5 rounded-xl border cursor-pointer transition relative ${
                selectedTier === tier.amount
                  ? "bg-slate-50 border-slate-900 ring-2 ring-slate-900 shadow-sm"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              {tier.isPopular && (
                <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-white">
                  Popular
                </span>
              )}
              <div className="text-xs text-slate-500 font-semibold">{tier.label}</div>
              <div className="text-2xl font-extrabold text-slate-900 font-mono mt-2">₹{tier.amount.toLocaleString()}</div>
              <div className="text-xs text-blue-700 mt-1 font-bold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                <span>Get ₹{tier.credits.toLocaleString()} Credits</span>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleRecharge}
          disabled={isProcessing}
          className="w-full mt-4 py-3 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow flex items-center justify-center gap-2 transition disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying Razorpay Order & Crediting Balance...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              <span>Recharge ₹{selectedTier.toLocaleString()} via Razorpay Checkout</span>
            </>
          )}
        </button>
      </div>

      {/* Modular Engine Add-ons Section (Model 3) */}
      <div id="addons" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Modular Engine Add-ons</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                Power-Ups
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-0.5">
              Unlock specialized engines individually on Starter or Pro plans without paying for full Enterprise.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 font-mono">
              Wallet Balance: <strong className="text-slate-900 font-mono">₹{walletBalance.toFixed(2)}</strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {addons.map((addon) => {
            const isEnterprise = currentPlanTier === "ENTERPRISE";
            const isActive = isEnterprise || activeAddons.includes(addon.id);

            return (
              <div
                key={addon.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                  isActive
                    ? "bg-slate-50/70 border-slate-300 ring-1 ring-slate-900/5 shadow-xs"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-xs">{addon.name}</span>
                      </div>
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                        {addon.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-slate-900 font-bold text-xs">
                        ₹{addon.priceMonthly}
                      </div>
                      <div className="text-[10px] text-slate-400">/ month</div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                    {addon.description}
                  </p>

                  {/* Quota specification pill */}
                  <div className="mt-2.5 py-1.5 px-2.5 rounded-lg bg-slate-100/80 border border-slate-200/60 flex items-center justify-between text-[10px] font-mono text-slate-700">
                    <span>
                      Quota: <strong className="text-slate-900 font-bold">{(addon.monthlyQuota || 1000).toLocaleString()} {addon.category === "REPORTS" ? "PDFs" : "calls"}</strong>
                    </span>
                    <span>
                      Limit: <strong className="text-slate-900 font-bold">{addon.rateLimitPerMin || 60} RPM</strong>
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-1.5 text-[10px] text-slate-700">
                    {(addon.features || []).map((feat: string, fIdx: number) => (
                      <div key={fIdx} className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/80">
                  {isEnterprise ? (
                    <div className="w-full py-1.5 px-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px] flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Included in Enterprise Plan</span>
                    </div>
                  ) : isActive ? (
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active on Account</span>
                      </span>
                      <button
                        onClick={() => handleCancelAddon(addon)}
                        disabled={togglingAddon === addon.id}
                        className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold underline disabled:opacity-50"
                      >
                        {togglingAddon === addon.id ? "Cancelling..." : "Cancel Add-on"}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedAddonForPurchase(addon)}
                      className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow flex items-center justify-center gap-1.5 transition"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Activate for ₹{addon.priceMonthly}/mo</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compact Banner: Invoices & Tax Profile */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 mt-0.5">
            <FileText className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">GST Tax Invoices & Business Tax Profile</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure your Company GSTIN, Registered Address, and view or download all past settled tax invoices.
            </p>
          </div>
        </div>

        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition shadow-xs self-start sm:self-auto shrink-0"
        >
          <span>View Invoices & GST Profile</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
      {/* Upgrade Plan Modal: Choose Payment Method (Wallet vs Gateway) */}
      {selectedPlanForUpgrade && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Upgrade to {selectedPlanForUpgrade.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Choose your preferred payment method to activate plan</p>
              </div>
              <button 
                onClick={() => setSelectedPlanForUpgrade(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Proration Calculation Banner */}
            {(() => {
              const currentPlanObj = plans.find(p => p.tier === currentPlanTier);
              const currentPlanCost = currentPlanObj?.priceMonthly || 0;
              let unusedDays = 0;
              let creditDiscount = 0;

              if (userSubscription?.currentPeriodEnd && currentPlanCost > 0) {
                const diffTime = new Date(userSubscription.currentPeriodEnd).getTime() - new Date().getTime();
                unusedDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                if (unusedDays > 0 && unusedDays <= 30) {
                  creditDiscount = Math.round((currentPlanCost / 30) * unusedDays * 100) / 100;
                }
              }

              const netPayable = Math.max(0, Math.round((selectedPlanForUpgrade.priceMonthly - creditDiscount) * 100) / 100);

              return (
                <div className="space-y-4">
                  {creditDiscount > 0 ? (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                      <div className="font-bold flex items-center justify-between">
                        <span>Prorated Upgrade Credit Applied:</span>
                        <span className="font-mono text-emerald-700">-₹{creditDiscount.toFixed(2)}</span>
                      </div>
                      <p className="text-[11px] text-emerald-800">
                        You have <strong>{unusedDays} days remaining</strong> in your current {currentPlanTier} plan. Unused amount has been automatically credited toward this upgrade.
                      </p>
                    </div>
                  ) : null}

                  {/* Plan Price Summary */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-500 font-semibold">
                        {creditDiscount > 0 ? "Adjusted Net Payable Price" : "Monthly Subscription Price"}
                      </div>
                      <div className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">
                        ₹{netPayable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        {creditDiscount > 0 && (
                          <span className="text-xs text-slate-400 line-through font-normal ml-2">
                            ₹{selectedPlanForUpgrade.priceMonthly.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-600 font-medium">
                      <div>{selectedPlanForUpgrade.includedQuota.toLocaleString()} calls / mo</div>
                      <div className="text-[11px] text-slate-400">{selectedPlanForUpgrade.rateLimitPerMin} RPM</div>
                    </div>
                  </div>

                  {/* Option 1: Live Wallet Balance */}
                  <div className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                          <Wallet className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">Option 1: Pay via Wallet Balance</div>
                          <div className="text-[11px] text-slate-500">
                            Available: <strong className="text-slate-800 font-mono">₹{walletBalance.toFixed(2)}</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {walletBalance >= netPayable ? (
                      <button
                        onClick={() => executeUpgrade(selectedPlanForUpgrade.tier, "WALLET")}
                        disabled={subscribingTier === selectedPlanForUpgrade.tier}
                        className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
                      >
                        {subscribingTier === selectedPlanForUpgrade.tier ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Processing Debit...</span>
                          </>
                        ) : (
                          <span>Pay ₹{netPayable.toLocaleString("en-IN", { minimumFractionDigits: 2 })} from Wallet</span>
                        )}
                      </button>
                    ) : (
                      <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                        <span>Insufficient balance (Short by ₹{(netPayable - walletBalance).toFixed(2)}). Recharge wallet or use Payment Gateway below.</span>
                      </div>
                    )}
                  </div>

                  {/* Option 2: Direct Payment Gateway Checkout */}
                  <div className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Option 2: Pay via Razorpay Gateway</div>
                        <div className="text-[11px] text-slate-500">UPI, Credit/Debit Cards, NetBanking, Corporate</div>
                      </div>
                    </div>

                    <button
                      onClick={() => executeUpgrade(selectedPlanForUpgrade.tier, "GATEWAY")}
                      disabled={subscribingTier === selectedPlanForUpgrade.tier}
                      className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-xs"
                    >
                      {subscribingTier === selectedPlanForUpgrade.tier ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Opening Gateway & Verifying...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pay ₹{netPayable.toLocaleString("en-IN", { minimumFractionDigits: 2 })} with Razorpay</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })()}

            <div className="text-[11px] text-center text-slate-400">
              Transactions generate compliant GST Tax Invoices immediately upon settlement.
            </div>
          </div>
        </div>
      )}

      {/* Add-on Payment Selection Modal (Wallet vs Razorpay) */}
      {selectedAddonForPurchase && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  Add-on Activation
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Activate {selectedAddonForPurchase.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAddonForPurchase(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              {selectedAddonForPurchase.description}
            </p>

            {/* Price & Quota Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Included Monthly Quota</span>
                <span className="text-xs font-mono font-bold text-slate-800">
                  {(selectedAddonForPurchase.monthlyQuota || 1000).toLocaleString()} {selectedAddonForPurchase.category === "REPORTS" ? "PDFs" : "calls"} / mo
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Price</span>
                <span className="text-xl font-black font-mono text-slate-900">
                  ₹{selectedAddonForPurchase.priceMonthly}
                </span>
                <span className="text-[10px] text-slate-400">/mo</span>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Select Payment Method:
              </div>

              {/* Option 1: Pay from Live Wallet */}
              <div className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-800">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Option 1: Pay from Wallet</div>
                      <div className="text-[11px] text-slate-500">
                        Available Balance: <strong className="font-mono text-slate-900">₹{walletBalance.toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {walletBalance >= selectedAddonForPurchase.priceMonthly ? (
                  <button
                    onClick={() => executeAddonPurchase(selectedAddonForPurchase, "WALLET")}
                    disabled={purchasingAddonMethod === "WALLET"}
                    className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
                  >
                    {purchasingAddonMethod === "WALLET" ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Deducting Wallet Balance...</span>
                      </>
                    ) : (
                      <span>Pay ₹{selectedAddonForPurchase.priceMonthly} from Wallet</span>
                    )}
                  </button>
                ) : (
                  <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    Insufficient wallet balance (Short by ₹{(selectedAddonForPurchase.priceMonthly - walletBalance).toFixed(2)}). Pay with Razorpay below.
                  </div>
                )}
              </div>

              {/* Option 2: Pay directly with Razorpay */}
              <div className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Option 2: Pay via Razorpay Gateway</div>
                    <div className="text-[11px] text-slate-500">UPI, QR, Credit/Debit Cards, NetBanking</div>
                  </div>
                </div>

                <button
                  onClick={() => executeAddonPurchase(selectedAddonForPurchase, "GATEWAY")}
                  disabled={purchasingAddonMethod === "GATEWAY"}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-xs"
                >
                  {purchasingAddonMethod === "GATEWAY" ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Opening Razorpay Checkout...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Pay ₹{selectedAddonForPurchase.priceMonthly} with Razorpay</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
