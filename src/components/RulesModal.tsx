import React from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

interface RulesModalProps {
  onClose: () => void;
  onStart: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ onClose, onStart }) => {
  const rules = [
    { num: '১', text: 'রাস্তায় ঘুরে NPC খুঁজুন (দোকানদার, পথচারী, ব্যবসায়ী)।' },
    { num: '২', text: 'NPC-এর কাছে গিয়ে "চান্দা" বাটন অথবা কিবোর্ডে "E" চাপুন।' },
    { num: '৩', text: 'সফল হলে সাথে সাথে চান্দা স্কোর বাড়বে (+৳৫০, +৳১০০, +৳২০০)।' },
    { num: '৪', text: 'বেশি ঘনঘন চান্দা আদায় করলে "ধরা পড়ার ঝুঁকি" লাল হয়ে যাবে!' },
    { num: '৫', text: 'পুলিশ বা ধাওয়া শুরু হলে দৌড়ে অথবা "এড়িয়ে যাও" (Space) দিয়ে পালিয়ে যান।' },
    { num: '৬', text: 'পুলিশের হাতে ধরা পড়লে খেলা সাথে সাথে শেষ হবে।' },
    { num: '৭', text: 'লক্ষ্য পূরণ করলেই লেভেল সম্পন্ন হবে এবং নতুন বাজার আনলক হবে!' },
  ];

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center">
              ৳
            </div>
            <h2 className="text-xl font-bold text-white font-bengali">খেলার নিয়মাবলী</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 7 Rules List */}
        <div className="space-y-2.5 font-bengali">
          {rules.map((rule, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-950/60 border border-stone-800/80 text-sm"
            >
              <div className="w-6 h-6 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                {rule.num}
              </div>
              <p className="text-stone-200 leading-snug">{rule.text}</p>
            </div>
          ))}
        </div>

        {/* NPC Value Guide */}
        <div className="mt-4 p-3 bg-stone-950/70 border border-stone-800 rounded-2xl">
          <div className="text-xs font-bold text-amber-400 font-bengali mb-2">চান্দা রেট চার্ট:</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-bengali">
            <div className="p-2 rounded-lg bg-stone-900 border border-stone-800">
              <div className="text-stone-400">পথচারী</div>
              <div className="font-bold text-amber-300 font-num text-sm">+৳৫০</div>
            </div>
            <div className="p-2 rounded-lg bg-stone-900 border border-stone-800">
              <div className="text-stone-400">দোকানদার</div>
              <div className="font-bold text-amber-300 font-num text-sm">+৳১০০</div>
            </div>
            <div className="p-2 rounded-lg bg-stone-900 border border-stone-800">
              <div className="text-stone-400">ব্যবসায়ী</div>
              <div className="font-bold text-amber-300 font-num text-sm">+৳২০০</div>
            </div>
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <div className="text-amber-300">ভিআইপি বোনাস</div>
              <div className="font-bold text-amber-300 font-num text-sm">+৳৫০০</div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-5 flex gap-2.5">
          <button
            onClick={onStart}
            className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-bold font-bengali transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            বুঝেছি, খেলা শুরু করুন!
          </button>
        </div>
      </div>
    </div>
  );
};
