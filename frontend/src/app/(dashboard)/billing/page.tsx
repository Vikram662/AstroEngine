"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { CreditCard, Wallet, CheckCircle2, Zap, ShieldCheck, Loader2, AlertCircle, ArrowUpRight, FileText, BadgePercent, Check, X } from "lucide-react";
import { ApiData, toApiError } from "@/lib/apiTypes";

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

interface CheckoutOffer {
  code: string;
  title: string;
  targetType: "PLAN" | "ADDON";
  targetId: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
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
  const [transactions, setTransactions] = useState<ApiData[]>([]);
  const [addons, setAddons] = useState<ApiData[]>([]);
  const [addonsLoaded, setAddonsLoaded] = useState(false);
  const [activeAddons, setActiveAddons] = useState<string[]>([]);
  const [togglingAddon, setTogglingAddon] = useState<string | null>(null);
  const [selectedAddonForPurchase, setSelectedAddonForPurchase] = useState<ApiData | null>(null);
  const [purchasingAddonMethod, setPurchasingAddonMethod] = useState<string | null>(null);
  const [offerCode, setOfferCode] = useState("");
  const [appliedOffer, setAppliedOffer] = useState<CheckoutOffer | null>(null);
  const [availableOffers, setAvailableOffers] = useState<ApiData[]>([]);
  const [validatingOffer, setValidatingOffer] = useState(false);

  const [userSubscription, setUserSubscription] = useState<{ currentPeriodEnd?: string } | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userDataLoaded, setUserDataLoaded] = useState(false);
  const checkoutLinkHandled = useRef(false);

  const fetchAddons = () => {
    axios.get("/api/user/addons")
      .then(res => {
        if (res.data?.catalog) {
          setAddons(res.data.catalog);
          setActiveAddons(res.data.activeAddons || []);
        }
      })
      .catch(() => {})
      .finally(() => setAddonsLoaded(true));
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
          setUserName(res.data.data.name || "");
          setUserEmail(res.data.data.email || "");
        }
      })
      .catch(() => {})
      .finally(() => setUserDataLoaded(true));

    axios.get("/api/billing/offers")
      .then(res => setAvailableOffers(res.data?.data || []))
      .catch(() => setAvailableOffers([]));

    // Fetch user transaction history from database
    axios.get("/api/billing/recharge")
      .then(res => {
        if (res.data?.transactions) {
          setTransactions(res.data.transactions.map((t: ApiData) => ({
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

  const resetCheckoutOffer = () => {
    setOfferCode("");
    setAppliedOffer(null);
  };

  const applyCheckoutOffer = useCallback(async (targetType: "PLAN" | "ADDON", targetId: string, amount: number, code = offerCode) => {
    setValidatingOffer(true);
    setErrorMessage(null);
    try {
      const res = await axios.post("/api/billing/offers", { code, targetType, targetId, amount });
      setAppliedOffer(res.data.data);
      setOfferCode(res.data.data.code);
    } catch (errCaught) { const err = toApiError(errCaught);
      setAppliedOffer(null);
      setErrorMessage(err.response?.data?.message || "Offer code could not be applied.");
    } finally {
      setValidatingOffer(false);
    }
  }, [offerCode]);

  const openAddonPurchaseModal = (addon: ApiData) => {
    resetCheckoutOffer();
    setSelectedAddonForPurchase(addon);
  };

  const openUpgradeModal = (plan: SubscriptionPlanData) => {
    if (plan.tier === "STARTER" || plan.priceMonthly === 0) {
      // Free plan switches directly
      executeUpgrade(plan.tier, "WALLET");
    } else {
      resetCheckoutOffer();
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
        const adjustedPrice = Math.max(0, Math.round(((selectedPlanForUpgrade?.priceMonthly || 0) - creditDiscount) * 100) / 100);
        const activeOffer = appliedOffer?.targetType === "PLAN" && appliedOffer.targetId === tier ? appliedOffer : null;
        const netPayable = activeOffer?.finalAmount ?? adjustedPrice;

        const orderRes = await axios.post("/api/billing/recharge", {
          action: "create_order",
          amount: netPayable
        });

        const { orderId, key, amount, currency } = orderRes.data;

        // Check if Razorpay SDK script is loaded
        if (typeof window !== "undefined" && (window as ApiData).Razorpay) {
          const options = {
            key: key || "rzp_test_mock_enterprise_key",
            amount: Math.round(amount * 100), // in paise
            currency: currency || "INR",
            name: "AstroEngine Cloud",
            description: `Upgrade to ${tier} Subscription Plan`,
            order_id: orderId,
            handler: async function (response: ApiData) {
              try {
                // Settle and verify upgrade via Gateway only AFTER successful user payment
                const res = await axios.post("/api/billing/subscribe", { 
                  planTier: tier,
                  paymentMethod: "GATEWAY",
                  gatewayOrderId: response.razorpay_order_id || orderId,
                  gatewayPaymentId: response.razorpay_payment_id,
                  gatewaySignature: response.razorpay_signature,
                  offerCode: activeOffer?.code,
                });

                if (res.data?.status === "success") {
                  setSuccessMessage(res.data.message || `Subscribed to ${tier} plan successfully via Gateway!`);
                  setSelectedPlanForUpgrade(null);
                  fetchUserData();
                } else {
                  setErrorMessage(res.data?.message || "Payment verified but subscription activation failed.");
                }
              } catch (subErrCaught) { const subErr = toApiError(subErrCaught);
                setErrorMessage(subErr.response?.data?.message || "Failed to confirm subscription.");
              } finally {
                setSubscribingTier(null);
              }
            },
            prefill: {
              name: userName || undefined,
              email: userEmail || undefined
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

          const rzp = new (window as ApiData).Razorpay(options);
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
          paymentMethod: "WALLET",
          offerCode: appliedOffer?.targetType === "PLAN" && appliedOffer.targetId === tier ? appliedOffer.code : undefined,
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
      const error = err as { response?: { data?: { message?: string; detail?: string } }; message?: string };
      const msg =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.message ||
        "Failed to subscribe to plan.";
      setErrorMessage(msg);
    } finally {
      setSubscribingTier(null);
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
      if (typeof window !== "undefined" && (window as ApiData).Razorpay) {
        const options = {
          key: key || "rzp_test_mock_enterprise_key",
          amount: Math.round(amount * 100),
          currency: currency || "INR",
          name: "AstroEngine Cloud",
          description: `Prepaid Wallet Recharge ₹${selectedTier}`,
          order_id: orderId,
          handler: async function (response: ApiData) {
            try {
              // Complete and verify payment transaction only AFTER user completes payment
              const verifyRes = await axios.post("/api/billing/recharge", {
                action: "verify_and_credit",
                amount: selectedTier,
                razorpayOrderId: response.razorpay_order_id || orderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              });

              if (verifyRes.data.status === "success") {
                fetchUserData();
                setSuccessMessage(verifyRes.data.message || "Recharge successful! Credits added to your wallet.");
              } else {
                setErrorMessage("Payment verification failed.");
              }
            } catch (vErrCaught) { const vErr = toApiError(vErrCaught);
              setErrorMessage(vErr.response?.data?.message || "Payment verification failed.");
            } finally {
              setIsProcessing(false);
            }
          },
          prefill: {
            name: userName || undefined,
            email: userEmail || undefined
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

        const rzp = new (window as ApiData).Razorpay(options);
        rzp.open();
        return;
      } else {
        setErrorMessage("Razorpay Checkout SDK is still loading. Please refresh and try again.");
        setIsProcessing(false);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; detail?: string } }; message?: string };
      const msg =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        error.message ||
        "Razorpay payment gateway is not configured. Please contact support.";
      setErrorMessage(msg);
      setIsProcessing(false);
    }
  };

  const handleCancelAddon = async (addon: ApiData) => {
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

  const executeAddonPurchase = async (addon: ApiData, method: "WALLET" | "GATEWAY") => {
    setPurchasingAddonMethod(method);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const activeOffer = appliedOffer?.targetType === "ADDON" && appliedOffer.targetId === addon.id ? appliedOffer : null;
      const payablePrice = activeOffer?.finalAmount ?? addon.priceMonthly;
      if (method === "GATEWAY") {
        const orderRes = await axios.post("/api/billing/recharge", {
          action: "create_order",
          amount: payablePrice
        });

        const { orderId, key, amount, currency } = orderRes.data;

        if (typeof window !== "undefined" && (window as ApiData).Razorpay) {
          const options = {
            key: key || "rzp_test_mock_enterprise_key",
            amount: Math.round(amount * 100),
            currency: currency || "INR",
            name: "AstroEngine Cloud",
            description: `Activate ${addon.name} Add-on`,
            order_id: orderId,
            handler: async function (response: ApiData) {
              try {
                const res = await axios.post("/api/user/addons", {
                  addonId: addon.id,
                  action: "activate",
                  paymentMethod: "GATEWAY",
                  gatewayOrderId: response.razorpay_order_id || orderId,
                  gatewayPaymentId: response.razorpay_payment_id,
                  gatewaySignature: response.razorpay_signature,
                  offerCode: activeOffer?.code,
                });

                if (res.data?.status === "success") {
                  setSuccessMessage(res.data.message);
                  setSelectedAddonForPurchase(null);
                  fetchUserData();
                } else {
                  setErrorMessage(res.data?.message || "Payment verified but addon activation failed.");
                }
              } catch (subErrCaught) { const subErr = toApiError(subErrCaught);
                setErrorMessage(subErr.response?.data?.message || "Failed to confirm addon activation.");
              } finally {
                setPurchasingAddonMethod(null);
              }
            },
            prefill: {
              name: userName || undefined,
              email: userEmail || undefined
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

          const rzp = new (window as ApiData).Razorpay(options);
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
          paymentMethod: "WALLET",
          offerCode: activeOffer?.code,
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

  useEffect(() => {
    if (checkoutLinkHandled.current || !userDataLoaded || plans.length === 0) return;

    const timeoutId = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const planTier = params.get("plan")?.toUpperCase();
      const addonId = params.get("addon");
      const linkedOffer = params.get("offer")?.trim() || "";

      if (planTier) {
        const plan = plans.find(item => item.tier === planTier);
        if (plan && plan.tier !== "STARTER" && plan.priceMonthly > 0) {
          checkoutLinkHandled.current = true;
          setSelectedPlanForUpgrade(plan);
          setOfferCode(linkedOffer);
          setAppliedOffer(null);

          if (linkedOffer) {
            const currentPlanCost = plans.find(item => item.tier === currentPlanTier)?.priceMonthly || 0;
            let creditDiscount = 0;
            if (userSubscription?.currentPeriodEnd && currentPlanCost > 0) {
              const remainingMs = new Date(userSubscription.currentPeriodEnd).getTime() - Date.now();
              const unusedDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
              if (unusedDays > 0 && unusedDays <= 30) {
                creditDiscount = Math.round((currentPlanCost / 30) * unusedDays * 100) / 100;
              }
            }
            const amount = Math.max(0, Math.round((plan.priceMonthly - creditDiscount) * 100) / 100);
            void applyCheckoutOffer("PLAN", plan.tier, amount, linkedOffer);
          }
          return;
        }
      }

      if (addonId) {
        if (!addonsLoaded) return;
        const addon = addons.find(item => item.id === addonId);
        if (addon) {
          checkoutLinkHandled.current = true;
          setSelectedAddonForPurchase(addon);
          setOfferCode(linkedOffer);
          setAppliedOffer(null);
          if (linkedOffer) {
            void applyCheckoutOffer("ADDON", addon.id, Number(addon.priceMonthly), linkedOffer);
          }
          return;
        }
      }

      checkoutLinkHandled.current = true;
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [addons, addonsLoaded, applyCheckoutOffer, currentPlanTier, plans, userDataLoaded, userSubscription]);

  const checkoutTotal = (targetType: "PLAN" | "ADDON", targetId: string, amount: number) =>
    appliedOffer?.targetType === targetType && appliedOffer.targetId === targetId
      ? appliedOffer.finalAmount
      : amount;

  const renderCheckoutOffer = (targetType: "PLAN" | "ADDON", targetId: string, amount: number) => {
    const active = appliedOffer?.targetType === targetType && appliedOffer.targetId === targetId ? appliedOffer : null;
    const eligible = availableOffers.filter((offer) =>
      offer.targetType === targetType && (!offer.targetId || offer.targetId === targetId),
    );
    return (
      <div className="rounded-md border border-accent/30 bg-accent-soft/60 p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-ink">
            <BadgePercent className="w-4 h-4" /> One-time offer
          </div>
          {active && <span className="text-[10px] font-bold text-emerald-700">SAVED ₹{active.discountAmount.toFixed(2)}</span>}
        </div>
        <div className="flex gap-2">
          <input
            value={offerCode}
            onChange={(event) => { setOfferCode(event.target.value.toUpperCase()); setAppliedOffer(null); }}
            placeholder="Enter offer code"
            className="min-w-0 flex-1 rounded-lg border border-accent/30 bg-white px-3 py-2 text-xs font-mono uppercase outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={() => applyCheckoutOffer(targetType, targetId, amount)}
            disabled={validatingOffer || !offerCode.trim()}
            className="rounded-lg bg-accent-hover px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            {validatingOffer ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
          </button>
        </div>
        {eligible.length > 0 && !active && (
          <div className="flex flex-wrap gap-1.5">
            {eligible.map((offer) => (
              <button
                key={offer.code}
                type="button"
                onClick={() => { setOfferCode(offer.code); applyCheckoutOffer(targetType, targetId, amount, offer.code); }}
                className="rounded-full border border-accent/30 bg-white px-2.5 py-1 text-[10px] font-bold text-accent-hover hover:border-accent"
                title={offer.description || offer.title}
              >
                {offer.code} · {offer.title}
              </button>
            ))}
          </div>
        )}
        {active && <p className="text-[11px] text-accent-hover">{active.title} applied. This code can be used only once on your account.</p>}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Floating Toast Notification (Always visible anywhere on the page & inside modals) */}
      {(errorMessage || successMessage) && (
        <div className="fixed top-5 right-5 z-[9999] max-w-md w-full p-4 rounded-md border transition-all animate-in slide-in-from-top-4 flex items-start gap-3 bg-white">
          {errorMessage ? (
            <>
              <div className="p-2 rounded-lg bg-rose-100 text-rose-600 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1 text-xs">
                <div className="font-bold text-rose-900 text-sm">Action Failed</div>
                <div className="text-rose-700 mt-0.5 leading-relaxed">{errorMessage}</div>
              </div>
              <button 
                onClick={() => setErrorMessage(null)} 
                className="text-ink-muted hover:text-ink-soft p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1 text-xs">
                <div className="font-bold text-emerald-900 text-sm">Success</div>
                <div className="text-emerald-700 mt-0.5 leading-relaxed">{successMessage}</div>
              </div>
              <button 
                onClick={() => setSuccessMessage(null)} 
                className="text-ink-muted hover:text-ink-soft p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-md border border-line shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Wallet & Dynamic Billing</h1>
        <p className="text-ink-soft text-xs sm:text-sm mt-1">
          Top up prepaid balance for high-throughput API calls and white-label PDF generation beyond plan quota.
        </p>
      </div>

      {/* Live Alerts */}
      {successMessage && (
        <div className="p-4 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between shadow-sm font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-md bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center justify-between shadow-sm font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-700 hover:text-rose-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Dynamic Wallet Balance Card */}
      <div className="bg-white p-6 rounded-md border border-line shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-ink-soft uppercase tracking-wider">Live Prepaid Balance</span>
          <div className="text-3xl font-extrabold text-ink font-mono mt-1">₹{walletBalance.toFixed(2)}</div>
          <div className="text-xs text-ink-soft mt-1">Automatic deduction: ₹0.02 / call after plan exhaustion</div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Webhook Verified Auto-Credit (§12.2)</span>
        </div>
      </div>

      {/* Current Subscription Plan & Upgrade Section (§8.2.6) */}
      <div className="bg-white p-6 rounded-md border border-line shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-ink-soft uppercase tracking-wider">Active Subscription</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-console text-white">
                {currentPlanTier} PLAN
              </span>
            </div>
            <p className="text-xs text-ink-soft mt-1">
              Monthly Quota: <strong className="text-ink">{currentQuota.toLocaleString()} calls/month</strong>. Upgrade anytime with automated Razorpay recurring mandates.
            </p>
          </div>
          <Link
            href="/pricing"
            className="text-xs font-semibold text-accent hover:text-accent-hover flex items-center gap-1 self-start sm:self-auto"
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
                className={`p-5 rounded-md border flex flex-col justify-between transition relative ${
                  isCurrent
                    ? "bg-surface border-console-line ring-2 ring-ink"
                    : "bg-white border-line hover:border-line"
                }`}
              >
                {p.isPopular && !isCurrent && (
                  <span className="absolute -top-2.5 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-accent text-white">
                    Recommended
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute -top-2.5 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-600 text-white flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Active Plan
                  </span>
                )}

                <div>
                  <h3 className="font-bold text-sm text-ink">{p.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-semibold font-mono text-ink">₹{p.priceMonthly.toLocaleString()}</span>
                    <span className="text-[11px] text-ink-soft">/month</span>
                  </div>

                  {/* Quota & Limits Box */}
                  <div className="mt-2.5 py-2 px-2.5 rounded-lg bg-surface border border-line text-[11px] font-mono text-ink space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Monthly Quota:</span>
                      <strong className="text-ink">{p.includedQuota.toLocaleString()} calls</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Rate Limit:</span>
                      <strong className="text-ink">{p.rateLimitPerMin} RPM</strong>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="mt-3.5 space-y-1.5 text-xs text-ink">
                    <div className="text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1">
                      Included in this Plan:
                    </div>
                    {(Array.isArray(p.features) ? p.features : []).map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-1.5 text-[11px] leading-tight text-ink">
                        <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-line">
                  <button
                    onClick={() => openUpgradeModal(p)}
                    disabled={isCurrent || subscribingTier === p.tier}
                    className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                      isCurrent
                        ? "bg-line text-ink-soft cursor-default"
                        : "bg-console hover:bg-console-line text-white shadow-xs"
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
      <div className="bg-white p-6 rounded-md border border-line shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-ink uppercase tracking-wider">Select Recharge Amount (INR)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tiers.map((tier) => (
            <div
              key={tier.amount}
              onClick={() => setSelectedTier(tier.amount)}
              className={`p-5 rounded-md border cursor-pointer transition relative ${
                selectedTier === tier.amount
                  ? "bg-surface border-console-line ring-2 ring-ink shadow-sm"
                  : "bg-white border-line hover:border-line"
              }`}
            >
              {tier.isPopular && (
                <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-console text-white">
                  Popular
                </span>
              )}
              <div className="text-xs text-ink-soft font-semibold">{tier.label}</div>
              <div className="text-2xl font-extrabold text-ink font-mono mt-2">₹{tier.amount.toLocaleString()}</div>
              <div className="text-xs text-accent-hover mt-1 font-bold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                <span>Get ₹{tier.credits.toLocaleString()} Credits</span>
              </div>
            </div>
          ))}
        </div>

        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between font-medium">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <button
          onClick={handleRecharge}
          disabled={isProcessing}
          className="w-full mt-4 py-3 px-4 rounded-lg bg-console hover:bg-console-line text-white font-bold text-xs shadow flex items-center justify-center gap-2 transition disabled:opacity-50"
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
      <div id="addons" className="bg-white p-6 rounded-md border border-line shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-ink">Modular Engine Add-ons</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-accent-soft text-accent-hover border border-accent/30">
                Power-Ups
              </span>
            </div>
            <p className="text-ink-soft text-xs mt-0.5">
              Unlock specialized engines individually on Starter or Pro plans without paying for full Enterprise.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-ink-muted font-mono">
              Wallet Balance: <strong className="text-ink font-mono">₹{walletBalance.toFixed(2)}</strong>
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
                className={`p-4 rounded-md border flex flex-col justify-between transition ${
                  isActive
                    ? "bg-surface/70 border-line ring-1 ring-ink/5 shadow-xs"
                    : "bg-white border-line hover:border-line hover:shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-ink text-xs">{addon.name}</span>
                      </div>
                      <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-surface-alt text-ink-soft border border-line">
                        {addon.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-ink font-bold text-xs">
                        ₹{addon.priceMonthly}
                      </div>
                      <div className="text-[10px] text-ink-muted">/ month</div>
                    </div>
                  </div>

                  <p className="text-[11px] text-ink-soft mt-2 leading-relaxed">
                    {addon.description}
                  </p>

                  {/* Quota specification pill */}
                  <div className="mt-2.5 py-1.5 px-2.5 rounded-lg bg-surface-alt/80 border border-line/60 flex items-center justify-between text-[10px] font-mono text-ink">
                    <span>
                      Quota: <strong className="text-ink font-bold">{(addon.monthlyQuota || 1000).toLocaleString()} {addon.category === "REPORTS" ? "PDFs" : "calls"}</strong>
                    </span>
                    <span>
                      Limit: <strong className="text-ink font-bold">{addon.rateLimitPerMin || 60} RPM</strong>
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-1.5 text-[10px] text-ink">
                    {(addon.features || []).map((feat: string, fIdx: number) => (
                      <div key={fIdx} className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-line/80">
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
                      onClick={() => openAddonPurchaseModal(addon)}
                      className="w-full py-2 px-3 rounded-lg bg-console hover:bg-console-line text-white font-bold text-xs shadow flex items-center justify-center gap-1.5 transition"
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
      <div className="bg-white p-5 rounded-md border border-line shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-surface-alt text-ink mt-0.5">
            <FileText className="w-5 h-5 text-ink" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink">GST Tax Invoices & Business Tax Profile</h3>
            <p className="text-xs text-ink-soft mt-0.5">
              Configure your Company GSTIN, Registered Address, and view or download all past settled tax invoices.
            </p>
          </div>
        </div>

        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-console hover:bg-console-line text-white font-semibold text-xs transition shadow-xs self-start sm:self-auto shrink-0"
        >
          <span>View Invoices & GST Profile</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Transaction & Payment History (SUCCESS, PENDING, FAILED) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Payment & Recharge History</h3>
            <p className="text-xs text-slate-500 mt-0.5">All wallet recharge and subscription payments with real-time status</p>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Total Records: <strong>{transactions.length}</strong>
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No transactions found yet. Recharge your wallet or upgrade a plan to see payment logs here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Order / Payment ID</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Credits Added</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-900">
                      {t.orderId}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      ₹{Number(t.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 text-emerald-700 font-bold">
                      {Number(t.creditsAdded || 0) > 0 ? `+₹${Number(t.creditsAdded).toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                      {t.date}
                    </td>
                    <td className="py-2.5 px-3">
                      {t.status === "SUCCESS" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>SUCCESS</span>
                        </span>
                      ) : t.status === "FAILED" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          <span>FAILED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          <span>PENDING</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Upgrade Plan Modal: Choose Payment Method (Wallet vs Gateway) */}
      {selectedPlanForUpgrade && (
        <div className="fixed inset-0 bg-console/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg max-w-md w-full p-6 border border-line space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div>
                <h3 className="text-base font-bold text-ink">Upgrade to {selectedPlanForUpgrade.name}</h3>
                <p className="text-xs text-ink-soft mt-0.5">Choose your preferred payment method to activate plan</p>
              </div>
              <button 
                onClick={() => { setSelectedPlanForUpgrade(null); resetCheckoutOffer(); }}
                className="text-ink-muted hover:text-ink p-1.5 rounded-lg hover:bg-surface-alt transition"
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
              const finalPayable = checkoutTotal("PLAN", selectedPlanForUpgrade.tier, netPayable);

              return (
                <div className="space-y-4">
                  {creditDiscount > 0 ? (
                    <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                      <div className="font-bold flex items-center justify-between">
                        <span>Prorated Upgrade Credit Applied:</span>
                        <span className="font-mono text-emerald-700">-₹{creditDiscount.toFixed(2)}</span>
                      </div>
                      <p className="text-[11px] text-emerald-800">
                        You have <strong>{unusedDays} days remaining</strong> in your current {currentPlanTier} plan. Unused amount has been automatically credited toward this upgrade.
                      </p>
                    </div>
                  ) : null}

                  {renderCheckoutOffer("PLAN", selectedPlanForUpgrade.tier, netPayable)}

                  {/* Plan Price Summary */}
                  <div className="p-4 rounded-md bg-surface border border-line flex items-center justify-between">
                    <div>
                      <div className="text-xs text-ink-soft font-semibold">
                        {creditDiscount > 0 ? "Adjusted Net Payable Price" : "Monthly Subscription Price"}
                      </div>
                      <div className="text-xl font-extrabold text-ink font-mono mt-0.5">
                        ₹{finalPayable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        {(creditDiscount > 0 || finalPayable < netPayable) && (
                          <span className="text-xs text-ink-muted line-through font-normal ml-2">
                            ₹{(finalPayable < netPayable ? netPayable : selectedPlanForUpgrade.priceMonthly).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-xs text-ink-soft font-medium">
                      <div>{selectedPlanForUpgrade.includedQuota.toLocaleString()} calls / mo</div>
                      <div className="text-[11px] text-ink-muted">{selectedPlanForUpgrade.rateLimitPerMin} RPM</div>
                    </div>
                  </div>

                  {/* Option 1: Live Wallet Balance */}
                  <div className="p-4 rounded-md border border-line hover:border-line transition space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-accent-soft text-accent-hover">
                          <Wallet className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-ink">Option 1: Pay via Wallet Balance</div>
                          <div className="text-[11px] text-ink-soft">
                            Available: <strong className="text-ink font-mono">₹{walletBalance.toFixed(2)}</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {walletBalance >= finalPayable ? (
                      <button
                        onClick={() => executeUpgrade(selectedPlanForUpgrade.tier, "WALLET")}
                        disabled={subscribingTier === selectedPlanForUpgrade.tier}
                        className="w-full py-2.5 rounded-lg bg-console hover:bg-console-line text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
                      >
                        {subscribingTier === selectedPlanForUpgrade.tier ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Processing Debit...</span>
                          </>
                        ) : (
                          <span>Pay ₹{finalPayable.toLocaleString("en-IN", { minimumFractionDigits: 2 })} from Wallet</span>
                        )}
                      </button>
                    ) : (
                      <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                        <span>Insufficient balance (Short by ₹{(finalPayable - walletBalance).toFixed(2)}). Recharge wallet or use Payment Gateway below.</span>
                      </div>
                    )}
                  </div>

                  {/* Option 2: Direct Payment Gateway Checkout */}
                  <div className="p-4 rounded-md border border-line hover:border-line transition space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-ink">Option 2: Pay via Razorpay Gateway</div>
                        <div className="text-[11px] text-ink-soft">UPI, Credit/Debit Cards, NetBanking, Corporate</div>
                      </div>
                    </div>

                    <button
                      onClick={() => executeUpgrade(selectedPlanForUpgrade.tier, "GATEWAY")}
                      disabled={subscribingTier === selectedPlanForUpgrade.tier || finalPayable <= 0}
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
                          <span>{finalPayable <= 0 ? "Use wallet option to activate free" : `Pay ₹${finalPayable.toLocaleString("en-IN", { minimumFractionDigits: 2 })} with Razorpay`}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {errorMessage && (
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex-1 leading-relaxed">{errorMessage}</div>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="text-[11px] text-center text-ink-muted">
              Transactions generate compliant GST Tax Invoices immediately upon settlement.
            </div>
          </div>
        </div>
      )}

      {/* Add-on Payment Selection Modal (Wallet vs Razorpay) */}
      {selectedAddonForPurchase && (
        <div className="fixed inset-0 z-50 bg-console/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-line p-6 max-w-md w-full space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-accent font-bold bg-accent-soft px-2 py-0.5 rounded-full border border-accent/30">
                  Add-on Activation
                </span>
                <h3 className="text-base font-bold text-ink mt-1">
                  Activate {selectedAddonForPurchase.name}
                </h3>
              </div>
              <button
                onClick={() => { setSelectedAddonForPurchase(null); resetCheckoutOffer(); }}
                className="text-ink-muted hover:text-ink-soft p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {renderCheckoutOffer("ADDON", selectedAddonForPurchase.id, selectedAddonForPurchase.priceMonthly)}

            <p className="text-xs text-ink-soft">
              {selectedAddonForPurchase.description}
            </p>

            {/* Price & Quota Box */}
            <div className="p-3.5 rounded-md bg-surface border border-line flex items-center justify-between">
              <div>
                <span className="text-[10px] text-ink-muted font-bold uppercase tracking-wider block">Included Monthly Quota</span>
                <span className="text-xs font-mono font-bold text-ink">
                  {(selectedAddonForPurchase.monthlyQuota || 1000).toLocaleString()} {selectedAddonForPurchase.category === "REPORTS" ? "PDFs" : "calls"} / mo
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-ink-muted font-bold uppercase tracking-wider block">Price</span>
                <span className="text-xl font-semibold font-mono text-ink">
                  ₹{checkoutTotal("ADDON", selectedAddonForPurchase.id, selectedAddonForPurchase.priceMonthly)}
                </span>
                <span className="text-[10px] text-ink-muted">/mo</span>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div className="text-xs font-bold text-ink uppercase tracking-wider">
                Select Payment Method:
              </div>

              {/* Option 1: Pay from Live Wallet */}
              <div className="p-4 rounded-md border border-line hover:border-line transition space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-surface-alt text-ink">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-ink">Option 1: Pay from Wallet</div>
                      <div className="text-[11px] text-ink-soft">
                        Available Balance: <strong className="font-mono text-ink">₹{walletBalance.toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {walletBalance >= checkoutTotal("ADDON", selectedAddonForPurchase.id, selectedAddonForPurchase.priceMonthly) ? (
                  <button
                    onClick={() => executeAddonPurchase(selectedAddonForPurchase, "WALLET")}
                    disabled={purchasingAddonMethod === "WALLET"}
                    className="w-full py-2.5 rounded-lg bg-console hover:bg-console-line text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
                  >
                    {purchasingAddonMethod === "WALLET" ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Deducting Wallet Balance...</span>
                      </>
                    ) : (
                      <span>Pay ₹{checkoutTotal("ADDON", selectedAddonForPurchase.id, selectedAddonForPurchase.priceMonthly)} from Wallet</span>
                    )}
                  </button>
                ) : (
                  <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    Insufficient wallet balance (Short by ₹{(checkoutTotal("ADDON", selectedAddonForPurchase.id, selectedAddonForPurchase.priceMonthly) - walletBalance).toFixed(2)}). Pay with Razorpay below.
                  </div>
                )}
              </div>

              {/* Option 2: Pay directly with Razorpay */}
              <div className="p-4 rounded-md border border-line hover:border-line transition space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-ink">Option 2: Pay via Razorpay Gateway</div>
                    <div className="text-[11px] text-ink-soft">UPI, QR, Credit/Debit Cards, NetBanking</div>
                  </div>
                </div>

                <button
                  onClick={() => executeAddonPurchase(selectedAddonForPurchase, "GATEWAY")}
                  disabled={purchasingAddonMethod === "GATEWAY" || checkoutTotal("ADDON", selectedAddonForPurchase.id, selectedAddonForPurchase.priceMonthly) <= 0}
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
                      <span>{checkoutTotal("ADDON", selectedAddonForPurchase.id, selectedAddonForPurchase.priceMonthly) <= 0 ? "Use wallet option to activate free" : `Pay ₹${checkoutTotal("ADDON", selectedAddonForPurchase.id, selectedAddonForPurchase.priceMonthly)} with Razorpay`}</span>
                    </>
                  )}
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">{errorMessage}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
