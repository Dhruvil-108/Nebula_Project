import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  Receipt,
  DollarSign,
  Calendar,
  Building2,
  FileText,
  AlertCircle,
  HelpCircle,
  Check,
  Briefcase,
  Layers,
  ShieldAlert,
  Car,
  MapPin,
  Utensils,
  Loader2,
  AlertTriangle,
  Plane,
  Coins,
} from 'lucide-react';
import { FloatingDropdown, type DropdownOption } from '../ui/FloatingDropdown';
import { AiReceiptScanModal } from './AiReceiptScanModal';
import { useAuth } from '../../contexts/AuthContext';
import {
  useCreateExpenseClaim,
  useExpenseCategories,
  useProjects,
  useCostCenters,
  useParseTextExpense,
  useCheckReceiptDuplicate,
  useCalculateMileage,
  useCalculatePerDiem,
  useTravelRequests,
  useActiveAdvancesForEmployee,
} from '../../hooks/useExpenses';
import { checkExpensePolicies } from '../../lib/expenseApi';
import type { ExpenseCategory, PolicyViolation, ExpenseType } from '../../types/expenses';

interface DepartmentOption {
  _id: string;
  name: string;
}

interface CreateClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: DepartmentOption[];
}

interface ClaimFormItem {
  id: string;
  expenseType: ExpenseType;
  categoryId: string;
  expenseDate: string;
  merchant: string;
  description: string;
  amount: string;
  taxAmount: string;
  isBillableToClient: boolean;
  clientName: string;
  receiptUrl?: string;
  receiptFileName?: string;
  receiptHash?: string;
  duplicateWarning?: string | null;
  // Mileage specifics
  vehicleType?: 'car' | 'motorcycle' | 'electric' | 'van';
  distance?: string;
  unit?: 'km' | 'mile';
  ratePerUnit?: number;
  // Per-Diem specifics
  destination?: string;
  days?: string;
  ratePerDay?: number;
  deductions?: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
}

export const CreateClaimModal: React.FC<CreateClaimModalProps> = ({
  isOpen,
  onClose,
  departments,
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [departmentId, setDepartmentId] = useState(departments[0]?._id || '');
  const [projectId, setProjectId] = useState('');
  const [costCenterId, setCostCenterId] = useState('');
  const [travelRequestId, setTravelRequestId] = useState('');
  const [cashAdvanceId, setCashAdvanceId] = useState('');
  const [deductAdvance, setDeductAdvance] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [notes, setNotes] = useState('');
  const [isAiScanOpen, setIsAiScanOpen] = useState(false);
  const [quickAddText, setQuickAddText] = useState('');
  const [policyViolations, setPolicyViolations] = useState<PolicyViolation[]>([]);
  const [justifications, setJustifications] = useState<Record<string, string>>({});

  const { data: categories = [] } = useExpenseCategories(true);
  const { data: projects = [] } = useProjects();
  const { data: costCenters = [] } = useCostCenters();
  const { data: travelRequests = [] } = useTravelRequests({ status: 'approved' });
  const { data: activeAdvances = [] } = useActiveAdvancesForEmployee(user?.id || user?._id);

  const createMutation = useCreateExpenseClaim();
  const parseTextMutation = useParseTextExpense();
  const duplicateCheckMutation = useCheckReceiptDuplicate();
  const calculateMileageMutation = useCalculateMileage();
  const calculatePerDiemMutation = useCalculatePerDiem();

  const [items, setItems] = useState<ClaimFormItem[]>([
    {
      id: 'item-1',
      expenseType: 'receipt',
      categoryId: categories[0]?._id || '',
      expenseDate: new Date().toISOString().split('T')[0],
      merchant: '',
      description: '',
      amount: '',
      taxAmount: '',
      isBillableToClient: false,
      clientName: '',
      vehicleType: 'car',
      unit: 'km',
      distance: '',
      ratePerUnit: 0.7,
      destination: '',
      days: '1',
      ratePerDay: 75,
      deductions: { breakfast: false, lunch: false, dinner: false },
    },
  ]);

  // Project Dropdown Options
  const projectOptions: DropdownOption[] = [
    { value: '', label: 'None (Internal / Non-Project)' },
    ...projects.map((p) => ({
      value: p._id,
      label: `${p.code} — ${p.name}`,
      sublabel: p.clientName ? `Client: ${p.clientName}` : undefined,
      icon: <Briefcase className="w-4 h-4 text-orange-500" />,
    })),
  ];

  // Cost Center Dropdown Options
  const costCenterOptions: DropdownOption[] = [
    { value: '', label: 'None (Default Cost Center)' },
    ...costCenters.map((cc) => ({
      value: cc._id,
      label: `${cc.code} — ${cc.name}`,
      icon: <Layers className="w-4 h-4 text-slate-400" />,
    })),
  ];

  // Department Dropdown Options
  const departmentOptions: DropdownOption[] = departments.map((d) => ({
    value: d._id,
    label: d.name,
    icon: <Building2 className="w-4 h-4 text-slate-400" />,
  }));

  // Pre-Trip Travel Authorization Options
  const travelRequestOptions: DropdownOption[] = [
    { value: '', label: 'None (Standalone / Non-Travel Claim)' },
    ...travelRequests.map((tr) => {
      const budget = tr.estimatedTotalCost || tr.totalEstimated || 0;
      const start = tr.departureDate || tr.startDate;
      const end = tr.returnDate || tr.endDate;
      const dateStr = start && end ? `${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}` : '';
      return {
        value: tr._id,
        label: `${tr.requestNumber} — ${tr.destination}`,
        sublabel: `Budget: $${budget.toLocaleString()}${dateStr ? ` • Dates: ${dateStr}` : ''}`,
        icon: <Plane className="w-4 h-4 text-sky-500" />,
      };
    }),
  ];

  // Auto-select advance if available
  React.useEffect(() => {
    if (activeAdvances.length > 0 && !cashAdvanceId) {
      setCashAdvanceId(activeAdvances[0]._id);
      setDeductAdvance(true);
    }
  }, [activeAdvances, cashAdvanceId]);

  const selectedAdvance = activeAdvances.find((adv) => adv._id === cashAdvanceId);
  const advanceBalance = selectedAdvance
    ? (selectedAdvance.balanceAmount !== undefined ? selectedAdvance.balanceAmount : (selectedAdvance.remainingBalance || 0))
    : 0;

  // Live policy check effect
  React.useEffect(() => {
    const validItems = items
      .filter((i) => (parseFloat(i.amount) || 0) > 0)
      .map((i) => ({
        categoryId: i.categoryId || categories[0]?._id || '',
        expenseDate: i.expenseDate || new Date().toISOString().split('T')[0],
        merchant: i.merchant.trim() || 'General Expense',
        amount: parseFloat(i.amount) || 0,
        currency,
        receiptUrl: i.receiptUrl || '',
      }));

    if (validItems.length === 0) {
      setPolicyViolations([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const result = await checkExpensePolicies({
          departmentId: departmentId || departments[0]?._id,
          items: validItems,
        });
        if (result && Array.isArray(result.violations)) {
          setPolicyViolations(result.violations);
        }
      } catch (e) {
        // Soft fallback
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [items, departmentId, currency, categories, departments]);

  // Category Dropdown Options
  const categoryOptions: DropdownOption[] = categories.map((c) => ({
    value: c._id,
    label: c.name,
    sublabel: c.glCode ? `GL: ${c.glCode}` : undefined,
    dotColor: c.color,
  }));

  // Currency Options
  const currencyOptions: DropdownOption[] = [
    { value: 'USD', label: 'USD ($)', sublabel: 'US Dollar' },
    { value: 'EUR', label: 'EUR (€)', sublabel: 'Euro' },
    { value: 'GBP', label: 'GBP (£)', sublabel: 'British Pound' },
    { value: 'INR', label: 'INR (₹)', sublabel: 'Indian Rupee' },
  ];

  const MILEAGE_BENCHMARKS: Record<string, Record<string, number>> = {
    car: { km: 0.7, mile: 0.67 },
    motorcycle: { km: 0.38, mile: 0.35 },
    electric: { km: 0.7, mile: 0.67 },
    van: { km: 0.75, mile: 0.72 },
  };

  const resolvePerDiemRate = (destination: string): number => {
    const dest = (destination || '').toLowerCase();
    if (
      dest.includes('new york') ||
      dest.includes('nyc') ||
      dest.includes('london') ||
      dest.includes('tokyo') ||
      dest.includes('san francisco') ||
      dest.includes('geneva') ||
      dest.includes('zurich')
    ) {
      return 120;
    }
    if (
      dest.includes('chicago') ||
      dest.includes('berlin') ||
      dest.includes('toronto') ||
      dest.includes('los angeles') ||
      dest.includes('paris')
    ) {
      return 95;
    }
    return 75;
  };

  const handleAddItem = (type: ExpenseType = 'receipt') => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        expenseType: type,
        categoryId: categories[0]?._id || '',
        expenseDate: new Date().toISOString().split('T')[0],
        merchant: '',
        description: '',
        amount: '',
        taxAmount: '',
        isBillableToClient: false,
        clientName: '',
        vehicleType: 'car',
        unit: 'km',
        distance: '',
        ratePerUnit: 0.7,
        destination: '',
        days: '1',
        ratePerDay: 75,
        deductions: { breakfast: false, lunch: false, dinner: false },
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof ClaimFormItem, value: any) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const updated = { ...i, [field]: value };

        // Auto-recalculate if mileage field changed
        if (updated.expenseType === 'mileage') {
          const vehicle = updated.vehicleType || 'car';
          const unit = updated.unit || 'km';
          const rate = MILEAGE_BENCHMARKS[vehicle]?.[unit] || 0.7;
          updated.ratePerUnit = rate;
          const dist = parseFloat(updated.distance || '0') || 0;
          if (dist > 0) {
            updated.amount = (dist * rate).toFixed(2);
          }
        }

        // Auto-recalculate if per-diem field changed
        if (updated.expenseType === 'per_diem') {
          const rate = resolvePerDiemRate(updated.destination || '');
          updated.ratePerDay = rate;
          const days = parseInt(updated.days || '1', 10) || 1;
          const ded = updated.deductions || { breakfast: false, lunch: false, dinner: false };
          const dedPct = (ded.breakfast ? 0.2 : 0) + (ded.lunch ? 0.3 : 0) + (ded.dinner ? 0.5 : 0);
          const netDaily = Math.max(0, rate * (1 - dedPct));
          updated.amount = (netDaily * days).toFixed(2);
        }

        return updated;
      })
    );
  };

  const handleQuickAdd = async () => {
    if (!quickAddText.trim()) return;
    try {
      const parsed = await parseTextMutation.mutateAsync(quickAddText.trim());

      let matchedCatId = categories[0]?._id || '';
      const catQuery = parsed.categoryName || parsed.suggestedCategory;
      if (catQuery) {
        const found = categories.find((c) =>
          c.name.toLowerCase().includes(catQuery.toLowerCase())
        );
        if (found) matchedCatId = found._id;
      }

      const isFirstBlank =
        items.length === 1 && !items[0].merchant && !items[0].amount;

      let newItem: ClaimFormItem;

      if (parsed.expenseType === 'mileage') {
        const unit = parsed.mileageDetails?.unit || 'km';
        const vehicle = (parsed.mileageDetails?.vehicleType as any) || 'car';
        const dist = parsed.mileageDetails?.distance?.toString() || '10';
        const rate = MILEAGE_BENCHMARKS[vehicle]?.[unit] || 0.7;
        const calcAmount = parsed.amount > 0 ? parsed.amount.toString() : (parseFloat(dist) * rate).toFixed(2);

        newItem = {
          id: `item-${Date.now()}`,
          expenseType: 'mileage',
          categoryId: matchedCatId,
          expenseDate: parsed.expenseDate || new Date().toISOString().split('T')[0],
          merchant: parsed.merchant || 'Vehicle Mileage Reimbursement',
          description: parsed.description || 'Business travel driving',
          amount: calcAmount,
          taxAmount: '0',
          isBillableToClient: false,
          clientName: '',
          vehicleType: vehicle,
          unit,
          distance: dist,
          ratePerUnit: rate,
          destination: '',
          days: '1',
          ratePerDay: 75,
          deductions: { breakfast: false, lunch: false, dinner: false },
        };
      } else if (parsed.expenseType === 'per_diem') {
        const dest = parsed.perDiemDetails?.destination || 'Business Travel';
        const days = parsed.perDiemDetails?.days?.toString() || '1';
        const rate = resolvePerDiemRate(dest);
        const calcAmount = parsed.amount > 0 ? parsed.amount.toString() : (rate * parseInt(days, 10)).toFixed(2);

        newItem = {
          id: `item-${Date.now()}`,
          expenseType: 'per_diem',
          categoryId: matchedCatId,
          expenseDate: parsed.expenseDate || new Date().toISOString().split('T')[0],
          merchant: parsed.merchant || `Per-Diem Allowance (${dest})`,
          description: parsed.description || 'Daily subsistence reimbursement',
          amount: calcAmount,
          taxAmount: '0',
          isBillableToClient: false,
          clientName: '',
          vehicleType: 'car',
          unit: 'km',
          distance: '',
          ratePerUnit: 0.7,
          destination: dest,
          days,
          ratePerDay: rate,
          deductions: { breakfast: false, lunch: false, dinner: false },
        };
      } else {
        newItem = {
          id: `item-${Date.now()}`,
          expenseType: 'receipt',
          categoryId: matchedCatId,
          expenseDate: parsed.expenseDate || new Date().toISOString().split('T')[0],
          merchant: parsed.merchant || 'General Expense',
          description: parsed.description || '',
          amount: parsed.amount > 0 ? parsed.amount.toString() : '',
          taxAmount: (parsed.taxAmount || 0).toString(),
          isBillableToClient: false,
          clientName: '',
          vehicleType: 'car',
          unit: 'km',
          distance: '',
          ratePerUnit: 0.7,
          destination: '',
          days: '1',
          ratePerDay: 75,
          deductions: { breakfast: false, lunch: false, dinner: false },
        };
      }

      if (isFirstBlank) {
        setItems([newItem]);
      } else {
        setItems((prev) => [...prev, newItem]);
      }
      setQuickAddText('');
    } catch (err) {
      // Toast handled by hook
    }
  };

  // Calculations
  const totalAmount = items.reduce(
    (sum, i) => sum + (parseFloat(i.amount) || 0),
    0
  );
  const totalTax = items.reduce(
    (sum, i) => sum + (parseFloat(i.taxAmount) || 0),
    0
  );

  const hasBlocks = policyViolations.some((v) => v.severity === 'block');

  const handleSubmit = async (submitNow: boolean) => {
    if (!title.trim()) return;

    if (submitNow && hasBlocks) {
      alert('Cannot submit claim: It violates organization policies. Please adjust line items or save as draft.');
      return;
    }

    const formattedItems = items
      .filter((i) => (parseFloat(i.amount) || 0) > 0)
      .map((i) => ({
        categoryId: i.categoryId || categories[0]?._id || '',
        expenseDate: i.expenseDate || new Date().toISOString().split('T')[0],
        merchant:
          i.merchant.trim() ||
          (i.expenseType === 'mileage'
            ? 'Vehicle Mileage'
            : i.expenseType === 'per_diem'
            ? 'Daily Subsistence'
            : 'General Expense'),
        description: i.description.trim(),
        amount: parseFloat(i.amount) || 0,
        taxAmount: parseFloat(i.taxAmount) || 0,
        currency,
        receiptUrl: i.receiptUrl || '',
        receiptFileName: i.receiptFileName || '',
        receiptHash: i.receiptHash || '',
        expenseType: i.expenseType || 'receipt',
        mileageDetails:
          i.expenseType === 'mileage'
            ? {
                distance: parseFloat(i.distance || '0') || 0,
                unit: i.unit || 'km',
                vehicleType: i.vehicleType || 'car',
                ratePerUnit: i.ratePerUnit || 0.7,
              }
            : undefined,
        perDiemDetails:
          i.expenseType === 'per_diem'
            ? {
                destination: i.destination?.trim() || 'Standard',
                days: parseInt(i.days || '1', 10) || 1,
                ratePerDay: i.ratePerDay || 75,
                breakfastProvided: Boolean(i.deductions?.breakfast),
                lunchProvided: Boolean(i.deductions?.lunch),
                dinnerProvided: Boolean(i.deductions?.dinner),
              }
            : undefined,
        isBillableToClient: i.isBillableToClient,
        clientName: i.clientName.trim(),
      }));

    if (formattedItems.length === 0) {
      alert('Please add at least one expense item with an amount greater than zero.');
      return;
    }

    const mappedViolations = policyViolations.map((v) => ({
      ...v,
      userJustification: justifications[v.policyId || v.policyName] || '',
    }));

    await createMutation.mutateAsync({
      title: title.trim(),
      departmentId: departmentId || departments[0]?._id,
      projectId: projectId || undefined,
      costCenterId: costCenterId || undefined,
      travelRequestId: travelRequestId || undefined,
      cashAdvanceId: deductAdvance && cashAdvanceId ? cashAdvanceId : undefined,
      currency,
      notes: notes.trim(),
      items: formattedItems,
      violations: mappedViolations,
      submitNow,
    });

    onClose();
  };

  const handleApplyAiItem = (aiItem: {
    merchant: string;
    expenseDate: string;
    amount: number;
    taxAmount: number;
    description: string;
    categoryId: string;
    receiptUrl?: string;
    receiptFileName?: string;
  }) => {
    // If the first item is blank, overwrite it, otherwise push new
    setItems((prev) => {
      const isFirstBlank =
        prev.length === 1 && !prev[0].merchant && !prev[0].amount;
      const newItem: ClaimFormItem = {
        id: `item-${Date.now()}`,
        expenseType: 'receipt',
        categoryId: aiItem.categoryId || categories[0]?._id || '',
        expenseDate: aiItem.expenseDate,
        merchant: aiItem.merchant,
        description: aiItem.description,
        amount: aiItem.amount.toString(),
        taxAmount: aiItem.taxAmount.toString(),
        isBillableToClient: false,
        clientName: '',
        receiptUrl: aiItem.receiptUrl,
        receiptFileName: aiItem.receiptFileName,
        vehicleType: 'car',
        unit: 'km',
        distance: '',
        ratePerUnit: 0.7,
        destination: '',
        days: '1',
        ratePerDay: 75,
        deductions: { breakfast: false, lunch: false, dinner: false },
      };

      if (isFirstBlank) return [newItem];
      return [...prev, newItem];
    });
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={onClose}
            />

            {/* Modal Window */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-[#ECE0D6] flex flex-col overflow-hidden z-10"
            >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-orange-50/40 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  New Expense Reimbursement Claim
                </h2>
                <p className="text-xs text-slate-500">
                  Enter claim details, attach itemized expenses, or scan receipts with AI
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

          {/* Form Content */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Top Row: Title, Department, Currency */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Claim Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q4 Client Onsite Trip & Software Tools"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-10 px-3.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 placeholder-slate-400"
                />
              </div>

              <div className="md:col-span-4">
                <FloatingDropdown
                  label="Department"
                  options={departmentOptions}
                  value={departmentId}
                  onChange={(val) => setDepartmentId(val)}
                  size="md"
                />
              </div>

              <div className="md:col-span-2">
                <FloatingDropdown
                  label="Currency"
                  options={currencyOptions}
                  value={currency}
                  onChange={(val) => setCurrency(val)}
                  size="md"
                />
              </div>
            </div>

            {/* Second Row: Project (Billable) & Cost Center */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FloatingDropdown
                label="Billable Project (Optional)"
                options={projectOptions}
                value={projectId}
                onChange={(val) => setProjectId(val)}
                size="md"
              />

              <FloatingDropdown
                label="Cost Center (Optional)"
                options={costCenterOptions}
                value={costCenterId}
                onChange={(val) => setCostCenterId(val)}
                size="md"
              />
            </div>

            {/* Third Row: Pre-Trip Authorization & Advance Offset */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FloatingDropdown
                label="Pre-Trip Travel Request (Optional)"
                options={travelRequestOptions}
                value={travelRequestId}
                onChange={(val) => setTravelRequestId(val)}
                size="md"
              />

              {activeAdvances.length > 0 ? (
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                        <Coins className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-800">
                          Active Cash Advance Available
                        </div>
                        <div className="text-[11px] text-amber-800 font-medium">
                          {selectedAdvance?.advanceNumber || activeAdvances[0].advanceNumber}: Balance ${advanceBalance.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={deductAdvance}
                        onChange={(e) => setDeductAdvance(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                  </div>
                  {deductAdvance && (
                    <div className="mt-2 text-[11px] text-slate-600 bg-white/80 rounded-lg p-1.5 border border-amber-100 flex items-center justify-between">
                      <span>Deduction from this claim:</span>
                      <span className="font-semibold text-amber-700">
                        -${Math.min(totalAmount, advanceBalance).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50/60 border border-slate-200/60 rounded-xl p-3 flex items-center gap-2.5 text-xs text-slate-500">
                  <Coins className="w-4 h-4 text-slate-400" />
                  <span>No outstanding cash advances on file for your account.</span>
                </div>
              )}
            </div>

            {/* Line Items Section Header & Quick-Add Bar */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Itemized Expenses</h3>
                  <p className="text-xs text-slate-500">
                    Add receipts, log vehicle mileage, or claim per-diem daily subsistence
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAiScanOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                    <span>Scan Receipt with AI</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddItem('receipt')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>
              </div>

              {/* Natural Language Quick-Add Bar (X3) */}
              <div className="mb-4 p-3 bg-gradient-to-r from-orange-50/70 via-white to-amber-50/50 rounded-xl border border-orange-200/80 shadow-2xs">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
                  <span className="text-xs font-bold text-orange-950">AI Smart Quick-Add</span>
                  <span className="text-[10px] text-orange-700/80">
                    Type naturally to auto-parse spend, mileage, or per-diem
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={quickAddText}
                    onChange={(e) => setQuickAddText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleQuickAdd();
                      }
                    }}
                    placeholder='Try: "Dinner with client at Nobu $185 yesterday" or "35 km client meeting driving car" or "3 days in London"'
                    className="flex-1 h-8 px-3 text-xs bg-white border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={handleQuickAdd}
                    disabled={parseTextMutation.isPending || !quickAddText.trim()}
                    className="inline-flex items-center gap-1.5 h-8 px-3.5 text-xs font-semibold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 rounded-lg shadow-2xs transition-all disabled:opacity-50 shrink-0"
                  >
                    {parseTextMutation.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    <span>{parseTextMutation.isPending ? 'Parsing...' : 'Add'}</span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-orange-200/80 transition-all space-y-3 relative group shadow-2xs"
                  >
                    {/* Item Card Header & Type Selector */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Item #{index + 1}
                        </span>
                        {item.expenseType === 'mileage' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Car className="w-3 h-3" /> Mileage Rate Engine
                          </span>
                        )}
                        {item.expenseType === 'per_diem' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            <Utensils className="w-3 h-3" /> Per-Diem Subsistence
                          </span>
                        )}
                        {item.expenseType === 'receipt' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                            <Receipt className="w-3 h-3" /> Receipt Expense
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {/* Type Switcher Tabs */}
                        <div className="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
                          <button
                            type="button"
                            onClick={() => handleUpdateItem(item.id, 'expenseType', 'receipt')}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                              item.expenseType === 'receipt'
                                ? 'bg-white text-orange-600 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Receipt className="w-3 h-3" />
                            <span>Receipt</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateItem(item.id, 'expenseType', 'mileage')}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                              item.expenseType === 'mileage'
                                ? 'bg-white text-orange-600 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Car className="w-3 h-3" />
                            <span>Mileage</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateItem(item.id, 'expenseType', 'per_diem')}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                              item.expenseType === 'per_diem'
                                ? 'bg-white text-orange-600 shadow-2xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            <Utensils className="w-3 h-3" />
                            <span>Per-Diem</span>
                          </button>
                        </div>

                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors ml-1"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Conditional Form Body based on Expense Type */}
                    {item.expenseType === 'receipt' && (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        {/* Category */}
                        <div className="md:col-span-4">
                          <FloatingDropdown
                            label="Category"
                            options={categoryOptions}
                            value={item.categoryId || categories[0]?._id}
                            onChange={(val) => handleUpdateItem(item.id, 'categoryId', val)}
                            size="sm"
                          />
                        </div>

                        {/* Date */}
                        <div className="md:col-span-3">
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Date
                          </label>
                          <input
                            type="date"
                            value={item.expenseDate}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'expenseDate', e.target.value)
                            }
                            className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-800"
                          />
                        </div>

                        {/* Merchant */}
                        <div className="md:col-span-3">
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Merchant / Vendor
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Uber, Delta, AWS"
                            value={item.merchant}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'merchant', e.target.value)
                            }
                            className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-800"
                          />
                        </div>

                        {/* Amount */}
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Amount ({currency})
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={item.amount}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'amount', e.target.value)
                            }
                            className="w-full h-8 px-2.5 text-xs font-bold text-orange-600 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-right"
                          />
                        </div>

                        {/* Description */}
                        <div className="md:col-span-8">
                          <input
                            type="text"
                            placeholder="Description or business reason for expense..."
                            value={item.description}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'description', e.target.value)
                            }
                            className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-700 placeholder-slate-400"
                          />
                        </div>

                        {/* Tax Amount */}
                        <div className="md:col-span-2">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Tax ($)"
                            value={item.taxAmount}
                            onChange={(e) =>
                              handleUpdateItem(item.id, 'taxAmount', e.target.value)
                            }
                            className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-700 text-right"
                          />
                        </div>

                        {/* Billable to Client Toggle */}
                        <div className="md:col-span-2 flex items-center justify-end">
                          <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 select-none">
                            <input
                              type="checkbox"
                              checked={item.isBillableToClient}
                              onChange={(e) =>
                                handleUpdateItem(
                                  item.id,
                                  'isBillableToClient',
                                  e.target.checked
                                )
                              }
                              className="w-3.5 h-3.5 rounded text-orange-600 focus:ring-orange-500"
                            />
                            <span>Client Billable</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Mileage Mode */}
                    {item.expenseType === 'mileage' && (
                      <div className="space-y-3 bg-emerald-50/20 p-3 rounded-lg border border-emerald-100">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          {/* Vehicle Type */}
                          <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Vehicle Type
                            </label>
                            <select
                              value={item.vehicleType || 'car'}
                              onChange={(e) =>
                                handleUpdateItem(item.id, 'vehicleType', e.target.value)
                              }
                              className="w-full h-8 px-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-800"
                            >
                              <option value="car">Personal Car</option>
                              <option value="electric">Electric Vehicle (EV)</option>
                              <option value="motorcycle">Motorcycle</option>
                              <option value="van">Van / Fleet Vehicle</option>
                            </select>
                          </div>

                          {/* Distance & Unit */}
                          <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Distance & Unit
                            </label>
                            <div className="flex gap-1.5">
                              <input
                                type="number"
                                step="0.1"
                                placeholder="e.g. 45"
                                value={item.distance || ''}
                                onChange={(e) =>
                                  handleUpdateItem(item.id, 'distance', e.target.value)
                                }
                                className="flex-1 h-8 px-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-800"
                              />
                              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-[10px]">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItem(item.id, 'unit', 'km')}
                                  className={`px-1.5 py-0.5 rounded font-semibold transition-all ${
                                    item.unit === 'km'
                                      ? 'bg-orange-500 text-white'
                                      : 'text-slate-600'
                                  }`}
                                >
                                  KM
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItem(item.id, 'unit', 'mile')}
                                  className={`px-1.5 py-0.5 rounded font-semibold transition-all ${
                                    item.unit === 'mile'
                                      ? 'bg-orange-500 text-white'
                                      : 'text-slate-600'
                                  }`}
                                >
                                  MI
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Trip Date */}
                          <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Travel Date
                            </label>
                            <input
                              type="date"
                              value={item.expenseDate}
                              onChange={(e) =>
                                handleUpdateItem(item.id, 'expenseDate', e.target.value)
                              }
                              className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-800"
                            />
                          </div>

                          {/* Auto-Calculated Amount */}
                          <div className="md:col-span-3">
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-xs font-semibold text-slate-700">
                                Reimbursable
                              </label>
                              <span className="text-[10px] text-emerald-700 font-medium">
                                @ ${item.ratePerUnit || 0.70}/{item.unit || 'km'}
                              </span>
                            </div>
                            <input
                              type="number"
                              step="0.01"
                              readOnly
                              value={item.amount}
                              className="w-full h-8 px-2.5 text-xs font-bold text-emerald-700 bg-emerald-50/60 border border-emerald-200 rounded-lg text-right"
                            />
                          </div>

                          {/* Route / Business Purpose */}
                          <div className="md:col-span-7">
                            <input
                              type="text"
                              placeholder="Origin, destination, and business justification (e.g. HQ to Client Site in San Jose)..."
                              value={item.description}
                              onChange={(e) =>
                                handleUpdateItem(item.id, 'description', e.target.value)
                              }
                              className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-700 placeholder-slate-400"
                            />
                          </div>

                          {/* Category */}
                          <div className="md:col-span-3">
                            <FloatingDropdown
                              label="Category"
                              options={categoryOptions}
                              value={item.categoryId || categories[0]?._id}
                              onChange={(val) => handleUpdateItem(item.id, 'categoryId', val)}
                              size="sm"
                            />
                          </div>

                          {/* Billable */}
                          <div className="md:col-span-2 flex items-center justify-end">
                            <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 select-none">
                              <input
                                type="checkbox"
                                checked={item.isBillableToClient}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    item.id,
                                    'isBillableToClient',
                                    e.target.checked
                                  )
                                }
                                className="w-3.5 h-3.5 rounded text-orange-600 focus:ring-orange-500"
                              />
                              <span>Billable</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Per-Diem Mode */}
                    {item.expenseType === 'per_diem' && (
                      <div className="space-y-3 bg-blue-50/20 p-3 rounded-lg border border-blue-100">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          {/* Destination */}
                          <div className="md:col-span-4">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Destination City
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. New York, Chicago, London"
                              value={item.destination || ''}
                              onChange={(e) =>
                                handleUpdateItem(item.id, 'destination', e.target.value)
                              }
                              className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-800"
                            />
                          </div>

                          {/* Start Date */}
                          <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Start Date
                            </label>
                            <input
                              type="date"
                              value={item.expenseDate}
                              onChange={(e) =>
                                handleUpdateItem(item.id, 'expenseDate', e.target.value)
                              }
                              className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-800"
                            />
                          </div>

                          {/* Number of Days */}
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Days
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="365"
                              value={item.days || '1'}
                              onChange={(e) =>
                                handleUpdateItem(item.id, 'days', e.target.value)
                              }
                              className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-800"
                            />
                          </div>

                          {/* Net Daily Rate & Total Amount */}
                          <div className="md:col-span-3">
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-xs font-semibold text-slate-700">
                                Total Allowance
                              </label>
                              <span className="text-[10px] text-blue-700 font-medium">
                                Base: ${item.ratePerDay || 75}/d
                              </span>
                            </div>
                            <input
                              type="number"
                              step="0.01"
                              readOnly
                              value={item.amount}
                              className="w-full h-8 px-2.5 text-xs font-bold text-blue-700 bg-blue-50/60 border border-blue-200 rounded-lg text-right"
                            />
                          </div>

                          {/* Meal Deductions Provided by Host/Conference */}
                          <div className="md:col-span-7 bg-white p-2 rounded-lg border border-slate-200">
                            <span className="text-[10px] font-semibold text-slate-600 block mb-1">
                              Meals Provided (Deducted per IRS standard):
                            </span>
                            <div className="flex items-center gap-4 text-xs text-slate-600">
                              <label className="inline-flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(item.deductions?.breakfast)}
                                  onChange={(e) =>
                                    handleUpdateItem(item.id, 'deductions', {
                                      ...item.deductions,
                                      breakfast: e.target.checked,
                                    })
                                  }
                                  className="w-3.5 h-3.5 rounded text-orange-600"
                                />
                                <span>Breakfast (-20%)</span>
                              </label>
                              <label className="inline-flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(item.deductions?.lunch)}
                                  onChange={(e) =>
                                    handleUpdateItem(item.id, 'deductions', {
                                      ...item.deductions,
                                      lunch: e.target.checked,
                                    })
                                  }
                                  className="w-3.5 h-3.5 rounded text-orange-600"
                                />
                                <span>Lunch (-30%)</span>
                              </label>
                              <label className="inline-flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(item.deductions?.dinner)}
                                  onChange={(e) =>
                                    handleUpdateItem(item.id, 'deductions', {
                                      ...item.deductions,
                                      dinner: e.target.checked,
                                    })
                                  }
                                  className="w-3.5 h-3.5 rounded text-orange-600"
                                />
                                <span>Dinner (-50%)</span>
                              </label>
                            </div>
                          </div>

                          {/* Category */}
                          <div className="md:col-span-3">
                            <FloatingDropdown
                              label="Category"
                              options={categoryOptions}
                              value={item.categoryId || categories[0]?._id}
                              onChange={(val) => handleUpdateItem(item.id, 'categoryId', val)}
                              size="sm"
                            />
                          </div>

                          {/* Billable */}
                          <div className="md:col-span-2 flex items-center justify-end">
                            <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 select-none">
                              <input
                                type="checkbox"
                                checked={item.isBillableToClient}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    item.id,
                                    'isBillableToClient',
                                    e.target.checked
                                  )
                                }
                                className="w-3.5 h-3.5 rounded text-orange-600 focus:ring-orange-500"
                              />
                              <span>Billable</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Live Policy Violations / Guidance */}
            {policyViolations.length > 0 && (
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 space-y-2.5">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-bold text-amber-900">
                    Expense Policy Pre-check ({policyViolations.length}{' '}
                    {policyViolations.length === 1 ? 'Notice' : 'Notices'})
                  </h4>
                </div>
                <div className="space-y-2">
                  {policyViolations.map((v, idx) => {
                    const key = v.policyId || v.policyName;
                    return (
                      <div
                        key={idx}
                        className="bg-white/90 p-3 rounded-lg border border-amber-200/60 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-800">{v.policyName}</span>
                          <span
                            className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              v.severity === 'block'
                                ? 'bg-rose-100 text-rose-700'
                                : v.severity === 'warn'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {v.severity === 'block' ? 'Blocking Rule' : v.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">{v.message}</p>
                        {v.severity === 'warn' && (
                          <div className="mt-2">
                            <label className="text-[10px] font-semibold text-amber-900 block mb-1">
                              Explanation / Justification for approvers:
                            </label>
                            <input
                              type="text"
                              value={justifications[key] || ''}
                              onChange={(e) =>
                                setJustifications((prev) => ({ ...prev, [key]: e.target.value }))
                              }
                              placeholder="e.g. Urgent client meeting requiring last-minute booking"
                              className="w-full px-2.5 py-1 text-xs bg-amber-50/50 border border-amber-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                General Notes / Approver Instructions
              </label>
              <textarea
                rows={2}
                placeholder="Add any additional context for your department manager or finance team..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Footer with Live Totals */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Gross Claim</span>
                <span className="text-base font-bold text-slate-900">
                  {currency} ${totalAmount.toFixed(2)}
                </span>
              </div>
              {deductAdvance && advanceBalance > 0 && (
                <div>
                  <span className="text-amber-600 block text-[11px]">Advance Offset</span>
                  <span className="text-sm font-semibold text-amber-700">
                    -${Math.min(totalAmount, advanceBalance).toFixed(2)}
                  </span>
                </div>
              )}
              {deductAdvance && advanceBalance > 0 && (
                <div className="pl-3 border-l border-slate-200">
                  <span className="text-slate-400 block text-[11px]">Net Payout</span>
                  <span className="text-base font-bold text-emerald-700">
                    ${Math.max(0, totalAmount - Math.min(totalAmount, advanceBalance)).toFixed(2)}
                  </span>
                </div>
              )}
              {totalTax > 0 && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Included Taxes</span>
                  <span className="text-sm font-semibold text-slate-700">
                    ${totalTax.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={createMutation.isPending || !title.trim()}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl shadow-2xs transition-colors disabled:opacity-50"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={createMutation.isPending || !title.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Submit Claim</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>

      {/* AI Receipt Scanner Sub-modal */}
      <AiReceiptScanModal
        isOpen={isAiScanOpen}
        onClose={() => setIsAiScanOpen(false)}
        categories={categories}
        onApplyExtractedItem={handleApplyAiItem}
      />
    </>
  );
};
