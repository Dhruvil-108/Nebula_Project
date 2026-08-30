import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  Receipt, 
  Package, 
  Sparkles, 
  Layers, 
  Check, 
  ArrowRight, 
  ArrowLeft 
} from 'lucide-react';
import { Button } from '../ui/Button';

interface WizardStepFocusProps {
  primaryFocus: string[];
  updatePrimaryFocus: (focus: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export const WizardStepFocus: React.FC<WizardStepFocusProps> = ({
  primaryFocus,
  updatePrimaryFocus,
  onNext,
  onBack,
}) => {
  const focusModules = [
    { id: 'all', name: 'All of the above', desc: 'Pre-configure the complete 6-module business operating hub.', icon: <Layers className="w-5 h-5 text-indigo-400" /> },
    { id: 'crm', name: 'CRM & Pipeline', desc: 'Lead tracking, 6-stage deal pipeline, ARR forecasting.', icon: <TrendingUp className="w-5 h-5 text-cyan-400" /> },
    { id: 'hrms', name: 'HRMS & People Ops', desc: 'Employee records, attendance tracking, leave requests.', icon: <Users className="w-5 h-5 text-violet-400" /> },
    { id: 'recruitment', name: 'Recruitment (ATS)', desc: 'Job requisitions, candidate pipelines, interview scorecards.', icon: <Briefcase className="w-5 h-5 text-emerald-400" /> },
    { id: 'expenses', name: 'Expense Management', desc: 'Multi-tier expense submission, receipt matching, GL audit.', icon: <Receipt className="w-5 h-5 text-sky-400" /> },
    { id: 'inventory', name: 'Inventory & Stock', desc: 'Warehouse tracking, low-stock pulse alerts, auto POs.', icon: <Package className="w-5 h-5 text-amber-400" /> },
    { id: 'analytics', name: 'Unified AI Analytics', desc: 'Cross-module executive KPIs and plain-language insights.', icon: <Sparkles className="w-5 h-5 text-indigo-300" /> },
  ];

  const toggleFocus = (id: string) => {
    if (id === 'all') {
      updatePrimaryFocus(['all']);
      return;
    }

    let updated = primaryFocus.filter((f) => f !== 'all');
    if (updated.includes(id)) {
      updated = updated.filter((f) => f !== id);
    } else {
      updated.push(id);
    }

    if (updated.length === 0) {
      updated = ['all'];
    }

    updatePrimaryFocus(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
        {focusModules.map((mod) => {
          const isSelected = primaryFocus.includes(mod.id);
          return (
            <div
              key={mod.id}
              onClick={() => toggleFocus(mod.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                isSelected
                  ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 shrink-0 mt-0.5">
                {mod.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-white">{mod.name}</span>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{mod.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 pt-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="w-1/3"
        >
          Back
        </Button>
        <Button
          type="submit"
          variant="primary"
          className="w-2/3"
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Continue to Teammate Invites →
        </Button>
      </div>
    </form>
  );
};
