import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plane,
  Building2,
  Calendar,
  DollarSign,
  Briefcase,
  FileText,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { FloatingDropdown, type DropdownOption } from '../ui/FloatingDropdown';
import { useCreateTravelRequest } from '../../hooks/useExpenses';
import type { DepartmentBudget, ExpenseProject } from '../../types/expenses';

interface CreateTravelRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Array<{ _id: string; name: string }>;
  projects?: ExpenseProject[];
}

export const CreateTravelRequestModal: React.FC<CreateTravelRequestModalProps> = ({
  isOpen,
  onClose,
  departments,
  projects = [],
}) => {
  const [destination, setDestination] = useState('');
  const [purpose, setPurpose] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [departmentId, setDepartmentId] = useState(departments[0]?._id || '');
  const [projectId, setProjectId] = useState('');
  const [currency, setCurrency] = useState('USD');

  // Cost estimates
  const [airfare, setAirfare] = useState<string>('');
  const [lodging, setLodging] = useState<string>('');
  const [meals, setMeals] = useState<string>('');
  const [transport, setTransport] = useState<string>('');
  const [other, setOther] = useState<string>('');

  const createMutation = useCreateTravelRequest();

  const numAirfare = parseFloat(airfare) || 0;
  const numLodging = parseFloat(lodging) || 0;
  const numMeals = parseFloat(meals) || 0;
  const numTransport = parseFloat(transport) || 0;
  const numOther = parseFloat(other) || 0;

  const estimatedTotalCost = numAirfare + numLodging + numMeals + numTransport + numOther;

  const departmentOptions: DropdownOption[] = departments.map((d) => ({
    value: d._id,
    label: d.name,
    icon: <Building2 className="w-4 h-4 text-slate-400" />,
  }));

  const projectOptions: DropdownOption[] = [
    { value: '', label: 'None (Internal / Non-Project Travel)' },
    ...projects.map((p) => ({
      value: p._id,
      label: `${p.code} — ${p.name}`,
      icon: <Briefcase className="w-4 h-4 text-orange-500" />,
    })),
  ];

  const currencyOptions: DropdownOption[] = [
    { value: 'USD', label: 'USD ($)', sublabel: 'US Dollar' },
    { value: 'EUR', label: 'EUR (€)', sublabel: 'Euro' },
    { value: 'GBP', label: 'GBP (£)', sublabel: 'British Pound' },
    { value: 'INR', label: 'INR (₹)', sublabel: 'Indian Rupee' },
  ];

  const handleSubmit = async (submitNow: boolean) => {
    if (!destination.trim() || !purpose.trim() || !departureDate || !returnDate) {
      alert('Please fill in Destination, Purpose, Departure Date, and Return Date.');
      return;
    }

    if (new Date(returnDate) < new Date(departureDate)) {
      alert('Return Date cannot be before Departure Date.');
      return;
    }

    if (estimatedTotalCost <= 0) {
      alert('Please specify at least one estimated cost bucket greater than zero.');
      return;
    }

    await createMutation.mutateAsync({
      destination: destination.trim(),
      purpose: purpose.trim(),
      departureDate,
      returnDate,
      departmentId: departmentId || departments[0]?._id,
      projectId: projectId || undefined,
      currency,
      estimatedAirfare: numAirfare,
      estimatedLodging: numLodging,
      estimatedMeals: numMeals,
      estimatedTransport: numTransport,
      estimatedOther: numOther,
      estimatedTotalCost,
      submitNow,
    });

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="relative w-full max-w-2xl bg-white border border-[#ECE0D6] rounded-2xl shadow-xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50/50 to-amber-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100/80 text-orange-600 flex items-center justify-center shadow-2xs">
                  <Plane className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Pre-Trip Travel Authorization
                  </h2>
                  <p className="text-xs text-slate-500">
                    Submit business travel dates and estimated costs for manager & budget approval
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Destination & Department */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Destination City / Country <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. London, UK or Chicago, IL"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full h-10 px-3.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 placeholder-slate-400"
                  />
                </div>

                <FloatingDropdown
                  label="Department Budget"
                  options={departmentOptions}
                  value={departmentId}
                  onChange={(val) => setDepartmentId(val)}
                  size="md"
                />
              </div>

              {/* Dates & Currency */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Departure Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Return Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                  />
                </div>

                <FloatingDropdown
                  label="Currency"
                  options={currencyOptions}
                  value={currency}
                  onChange={(val) => setCurrency(val)}
                  size="md"
                />
              </div>

              {/* Project & Purpose */}
              <div className="space-y-4">
                <FloatingDropdown
                  label="Client / Billable Project (Optional)"
                  options={projectOptions}
                  value={projectId}
                  onChange={(val) => setProjectId(val)}
                  size="md"
                />

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Business Justification & Purpose <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe client meeting objectives, conference name, or deliverable purpose..."
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Cost Breakdown Buckets */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Estimated Cost Buckets ({currency})
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Itemize expected travel expenses
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Flights / Rail
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={airfare}
                      onChange={(e) => setAirfare(e.target.value)}
                      className="w-full h-9 px-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Lodging / Hotel
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={lodging}
                      onChange={(e) => setLodging(e.target.value)}
                      className="w-full h-9 px-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Meals / Incidentals
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={meals}
                      onChange={(e) => setMeals(e.target.value)}
                      className="w-full h-9 px-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Ground Transport
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={transport}
                      onChange={(e) => setTransport(e.target.value)}
                      className="w-full h-9 px-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Other / Baggage
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={other}
                      onChange={(e) => setOther(e.target.value)}
                      className="w-full h-9 px-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">Total Pre-Trip Estimate</span>
                <span className="text-base font-bold text-slate-900">
                  {currency} ${estimatedTotalCost.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  disabled={createMutation.isPending || !destination.trim()}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl shadow-2xs transition-colors disabled:opacity-50"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  disabled={createMutation.isPending || !destination.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Submit Pre-Trip Request</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
