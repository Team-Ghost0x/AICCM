"use client";

import React, { useState, useEffect } from "react";
import { CloseIcon, CheckIcon } from "./icons";
import { createDeposit } from "@/lib/client/payments";
import { getCurrentUser } from "@/lib/client/auth";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PRESET_AMOUNTS = [25000, 50000, 100000, 250000];

export function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
  const [amount, setAmount] = useState<number>(50000);
  const [method, setMethod] = useState<"UPI" | "Card">("UPI");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDeposit = () => {
    if (amount <= 0) return;
    setIsProcessing(true);

    setTimeout(() => {
      createDeposit(amount, method);
      setTransactionId(`TX-RTK-${Math.floor(100000 + Math.random() * 900000)}`);
      setIsProcessing(false);
      setIsDone(true);

      setTimeout(() => {
        setIsDone(false);
        onClose();
        onSuccess?.();
      }, 1200);
    }, 800);
  };

  const user = getCurrentUser();

  return (
    <div className="fixed inset-0 z-50 bg-[#000000]/75 flex items-center justify-center p-4">
      <div className="bg-[#e5e5e5] border-2 border-[#000000] w-full max-w-md p-6 flex flex-col gap-5 text-left text-xs select-none">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#000000]/20 pb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full tally bg-[#0b7a43] animate-pulse inline-block" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#3d3d3d] font-bold">
                Retake Escrow &amp; Billing
              </span>
            </div>
            <h3 className="text-2xl font-black text-[#000000] tracking-tight">
              Add Funds to Studio Wallet
            </h3>
            <p className="text-xs text-[#3d3d3d] mt-1">
              Current balance: <strong className="text-[#000000] tabular-numbers">₹{user?.balanceInr.toLocaleString("en-IN")}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#3d3d3d] hover:text-[#000000] p-1 cursor-pointer"
            aria-label="Close payment modal"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Success State */}
        {isDone ? (
          <div className="bg-[#000000] text-[#ffffff] p-8 flex flex-col items-center justify-center gap-3 text-center">
            <span className="w-10 h-10 rounded-full status bg-[#0b7a43] flex items-center justify-center text-[#ffffff]">
              <CheckIcon size={24} strokeWidth={3} />
            </span>
            <strong className="text-base text-[#ffffff]">
              ₹{amount.toLocaleString("en-IN")} Deposited Successfully
            </strong>
            <span className="text-xs text-[#b9b9b9] font-mono">
              Transaction ID: #{transactionId}
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Amount Selection */}
            <div>
              <label className="font-bold text-[#000000] block mb-2 font-mono uppercase text-[11px]">
                Select Deposit Amount (INR)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt)}
                    className={`py-2 px-3 font-bold border border-[#000000] transition-all duration-150 cursor-pointer ${
                      amount === amt
                        ? "bg-[#000000] text-[#ffffff]"
                        : "bg-[#ffffff] text-[#000000] hover:bg-[#dedede]"
                    }`}
                  >
                    ₹{amt.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div>
              <label className="font-bold text-[#000000] block mb-1">
                Or Custom Amount (₹)
              </label>
              <input
                type="number"
                min={1000}
                step={5000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-[#ffffff] border border-[#000000] px-3 py-2 text-xs text-[#000000] font-mono font-bold focus:outline-none"
              />
            </div>

            {/* Payment Method Switcher */}
            <div>
              <label className="font-bold text-[#000000] block mb-2 font-mono uppercase text-[11px]">
                Payment Channel
              </label>
              <div className="grid grid-cols-2 bg-[#ffffff] p-1 border border-[#000000] rounded-[3px]">
                <button
                  type="button"
                  onClick={() => setMethod("UPI")}
                  className={`py-1.5 font-bold transition-all duration-150 cursor-pointer ${
                    method === "UPI"
                      ? "bg-[#000000] text-[#ffffff]"
                      : "text-[#3d3d3d] hover:text-[#000000]"
                  }`}
                >
                  Instant UPI / QR
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("Card")}
                  className={`py-1.5 font-bold transition-all duration-150 cursor-pointer ${
                    method === "Card"
                      ? "bg-[#000000] text-[#ffffff]"
                      : "text-[#3d3d3d] hover:text-[#000000]"
                  }`}
                >
                  Corporate Card
                </button>
              </div>
            </div>

            {/* UPI QR Simulation Box */}
            {method === "UPI" ? (
              <div className="p-4 bg-[#ffffff] border border-[#000000]/15 flex items-center justify-between">
                <div>
                  <strong className="block text-[#000000]">UPI VPA: payments@retake</strong>
                  <span className="text-[11px] text-[#3d3d3d]">Scan with GPay, PhonePe or Paytm</span>
                </div>
                <div className="w-12 h-12 bg-[#000000] flex items-center justify-center text-[#ffffff] font-mono text-[9px] text-center p-1 font-bold">
                  UPI QR
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[#ffffff] border border-[#000000]/15 flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Card Number: 4532 •••• •••• 8892"
                  className="bg-[#ffffff] border border-[#000000]/40 p-2 text-xs focus:outline-none"
                  defaultValue="4532 9012 4431 8892"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    defaultValue="10/28"
                    className="bg-[#ffffff] border border-[#000000]/40 p-2 text-xs focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="CVV"
                    defaultValue="482"
                    className="bg-[#ffffff] border border-[#000000]/40 p-2 text-xs focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Action Button */}
            <button
              type="button"
              onClick={handleDeposit}
              disabled={isProcessing}
              className="w-full bg-[#0b7a43] hover:bg-[#096637] text-[#ffffff] font-bold py-3.5 rounded-[3px] text-xs border-2 border-[#000000] transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0.5 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isProcessing
                ? "Processing Secure Deposit..."
                : `Deposit ₹${amount.toLocaleString("en-IN")} to Escrow`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
