import React, { useState } from 'react';
import {
  BookOpen,
  Scale,
  Calculator,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  FileText,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { LEGAL_METROLOGY_RULES, getRequiredFontHeight } from '../data/rulesData';

export const RulesReferenceView: React.FC = () => {
  const [calcPdpArea, setCalcPdpArea] = useState<number>(120);
  const [calcNetQty, setCalcNetQty] = useState<number>(250);
  const [calcPackageType, setCalcPackageType] = useState<'STANDARD' | 'BLOWN_MOULDED'>('STANDARD');
  const [expandedRule, setExpandedRule] = useState<string | null>(LEGAL_METROLOGY_RULES[0].ruleNumber);

  // Computations
  const minGeneralFont = getRequiredFontHeight(calcPdpArea, false);
  const minNetQtyFont = getRequiredFontHeight(calcPdpArea, true);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Top Title Banner */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Legal Metrology Statutory Handbook &amp; Font Calculator
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Codified mandates under Legal Metrology Act, 2009 and Legal Metrology (Packaged Commodities) Rules, 2011.
        </p>
      </div>

      {/* Interactive Schedule II Font Calculator */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Rule 7 &amp; Schedule II Font Height Calculator</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Statutory Table 1
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Determine legally mandatory minimum numeral &amp; letter heights based on package dimensions.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Inputs (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-1.5">
                <span>Principal Display Panel (PDP) Area:</span>
                <span className="text-emerald-400 text-sm font-mono">{calcPdpArea} cm²</span>
              </div>
              <input
                type="range"
                min="10"
                max="1000"
                step="5"
                value={calcPdpArea}
                onChange={(e) => setCalcPdpArea(Number(e.target.value))}
                className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>10 cm² (Small sachet)</span>
                <span>200 cm² (Pouch)</span>
                <span>500 cm² (Box)</span>
                <span>1000 cm² (Carton)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Net Quantity (g / ml):
                </label>
                <input
                  type="number"
                  value={calcNetQty}
                  onChange={(e) => setCalcNetQty(Number(e.target.value))}
                  className="w-full text-xs font-mono px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Container Technology:
                </label>
                <select
                  value={calcPackageType}
                  onChange={(e) => setCalcPackageType(e.target.value as any)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="STANDARD">Standard Printed Label / Wrapper</option>
                  <option value="BLOWN_MOULDED">Blown / Formed / Moulded Container</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results Display (6 cols) */}
          <div className="lg:col-span-6 bg-slate-800/80 rounded-2xl p-5 border border-slate-700 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Mandatory Minimum Height Thresholds
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-700/80 text-center">
                <span className="block text-[11px] text-slate-400 font-medium">
                  Net Quantity Numeral Height
                </span>
                <span className="text-3xl font-black text-emerald-400 mt-1 block">
                  {minNetQtyFont.toFixed(1)} mm
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Mandatory for &ldquo;{calcNetQty} g/ml&rdquo;
                </span>
              </div>

              <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-700/80 text-center">
                <span className="block text-[11px] text-slate-400 font-medium">
                  General Declarations Height
                </span>
                <span className="text-3xl font-black text-teal-300 mt-1 block">
                  {minGeneralFont.toFixed(1)} mm
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  MRP, Address, Date &amp; Care
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              <strong>Statutory Note:</strong> Printing below these font heights constitutes a violation under Rule 7 and invites notice and compounding fines up to ₹25,000 under Section 36(1).
            </p>
          </div>

        </div>
      </div>

      {/* Statutory Rules Accordion Reference */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900">
          Codified Declarations &amp; Legal Provisions
        </h3>

        <div className="space-y-3">
          {LEGAL_METROLOGY_RULES.map((rule) => {
            const isExpanded = expandedRule === rule.ruleNumber;
            return (
              <div
                key={rule.ruleNumber}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs transition-all"
              >
                <button
                  onClick={() => setExpandedRule(isExpanded ? null : rule.ruleNumber)}
                  className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg">
                      {rule.ruleNumber}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{rule.title}</h4>
                      <p className="text-xs text-slate-500">{rule.actReference}</p>
                    </div>
                  </div>

                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 border-t border-slate-100 space-y-4 text-xs">
                    <p className="text-slate-700 leading-relaxed font-medium">
                      {rule.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                        <h5 className="font-bold text-emerald-950 mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Statutory Requirements
                        </h5>
                        <ul className="space-y-1.5 text-slate-700">
                          {rule.statutoryRequirements.map((req, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-emerald-600 font-bold">•</span>
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100">
                        <h5 className="font-bold text-rose-950 mb-2 flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-rose-600" />
                          Common Enforcement Violations
                        </h5>
                        <ul className="space-y-1.5 text-slate-700">
                          {rule.commonViolations.map((v, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-rose-600 font-bold">•</span>
                              <span>{v}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-slate-600">
                        <strong>Statutory Penalty:</strong> {rule.penaltyProvision}
                      </span>
                      <span className="font-extrabold text-rose-700 bg-rose-100 px-2 py-0.5 rounded text-[11px]">
                        Fine: ₹{rule.minFineInr.toLocaleString('en-IN')} - ₹{rule.maxFineInr.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
