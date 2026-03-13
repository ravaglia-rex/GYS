import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const GYS_BLUE = '#1e3a8a';

type PaymentMethod = 'UPI' | 'CARD' | 'NET_BANKING';

const StudentPaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};

  const membershipName = (state as any).membershipName || 'Level 2 — Engage';
  const membershipPrice = (state as any).membershipPrice || '₹4,999';

  const [method, setMethod] = useState<PaymentMethod>('UPI');
  const [upiId, setUpiId] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Mock only: later we will trigger Razorpay / backend here.
    navigate('/students/register/welcome', {
      state: {
        membershipName,
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 bg-white/90 border-b border-gray-200 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="group flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors duration-200 hover:bg-slate-100 rounded-lg px-1 py-0.5 -ml-1"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-xs transition-all duration-200 group-hover:border-slate-400">
              ←
            </span>
            <span className="hidden xs:inline">Back</span>
          </button>

          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ backgroundColor: GYS_BLUE }}
            >
              GYS
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900 tracking-tight">
                Global Young Scholar
              </h1>
              <p className="text-xs text-gray-500">
                Powered by Argus, Access USA, EducationWorld
              </p>
            </div>
          </div>

          <div className="w-10" />
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col px-4 pb-12 pt-6 sm:px-6">
        <section className="rounded-2xl bg-white p-5 sm:p-7 shadow-md ring-1 ring-slate-100">
          {/* Order summary */}
          <p className="text-sm sm:text-base font-semibold uppercase tracking-wide text-slate-500">
            Order Summary
          </p>
          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5 sm:px-7 sm:py-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base sm:text-xl font-semibold text-slate-900">
                  {membershipName}
                </p>
                <p className="mt-1 text-xs sm:text-sm text-slate-600">
                  Annual membership • 5 assessments • Cross-synthesis reports
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl sm:text-2xl font-semibold" style={{ color: GYS_BLUE }}>
                  {membershipPrice}
                </p>
              </div>
            </div>
          </div>

          {/* Payment form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            <div>
              <p className="text-sm sm:text-base font-bold text-slate-700">Payment Method</p>

              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => setMethod('UPI')}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm sm:text-lg text-left ${
                    method === 'UPI'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  } transition-colors duration-150`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${
                        method === 'UPI' ? 'border-blue-600 bg-blue-600' : 'border-slate-400 bg-white'
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-white" />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900 text-base sm:text-lg">
                        <span className="mr-1.5" aria-hidden="true">
                          📱
                        </span>
                        UPI
                      </p>
                    </div>
                  </div>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500">
                    Google Pay, PhonePe, Paytm, or any UPI app
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('CARD')}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm sm:text-lg text-left ${
                    method === 'CARD'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  } transition-colors duration-150`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${
                        method === 'CARD' ? 'border-blue-600 bg-blue-600' : 'border-slate-400 bg-white'
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-white" />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900 text-base sm:text-lg">
                        <span className="mr-1.5" aria-hidden="true">
                          💳
                        </span>
                        Credit / Debit Card
                      </p>
                    </div>
                  </div>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500">
                    Visa, Mastercard, Rupay
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('NET_BANKING')}
                  className={`w-full rounded-2xl border px-4 py-3 text-sm sm:text-lg text-left ${
                    method === 'NET_BANKING'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  } transition-colors duration-150`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${
                        method === 'NET_BANKING'
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-slate-400 bg-white'
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-white" />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900 text-base sm:text-lg">
                        <span className="mr-1.5" aria-hidden="true">
                          🏦
                        </span>
                        Net Banking
                      </p>
                    </div>
                  </div>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500">
                    All major Indian banks
                  </p>
                </button>
              </div>
            </div>

            {method === 'UPI' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm sm:text-base font-bold text-slate-700">
                    Enter UPI ID or scan QR
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm sm:text-lg text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                    placeholder="yourname@upi"
                  />
                </div>

                <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                  <div>
                    <div className="h-20 w-20 mx-auto rounded-lg border border-slate-300 border-dashed" />
                    <p className="mt-3 text-xs sm:text-sm text-slate-500">
                      [ QR Code ]<br />
                      Scan with any UPI app
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-base sm:text-lg font-semibold text-white shadow-md hover:bg-blue-700 transition-colors duration-200"
            >
              Pay {membershipPrice} →
            </button>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 border-t border-slate-200 pt-3 text-[10px] sm:text-[11px] text-slate-500">
              <span>🔒 SSL Encrypted</span>
              <span>🛡️ Razorpay Secure</span>
              <span>🏦 RBI Compliant</span>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
};

export default StudentPaymentPage;

