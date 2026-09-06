import React from 'react';
import { Mail, Plus, Trash2, ArrowRight, ArrowLeft, UserPlus } from 'lucide-react';
import { Button } from '../ui/Button';

export interface TeammateInvite {
  email: string;
  role: 'admin' | 'manager' | 'hr' | 'recruiter' | 'sales' | 'finance' | 'inventory_manager' | 'employee';
}

interface WizardStepInvitesProps {
  invites: TeammateInvite[];
  updateInvites: (invites: TeammateInvite[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export const WizardStepInvites: React.FC<WizardStepInvitesProps> = ({
  invites,
  updateInvites,
  onNext,
  onBack,
}) => {
  const roleOptions: { value: TeammateInvite['role']; label: string }[] = [
    { value: 'admin', label: 'Admin' },
    { value: 'manager', label: 'Department Manager' },
    { value: 'hr', label: 'HR Manager' },
    { value: 'recruiter', label: 'Recruiter' },
    { value: 'sales', label: 'Sales AE / Rep' },
    { value: 'finance', label: 'Finance Manager' },
    { value: 'inventory_manager', label: 'Inventory Manager' },
    { value: 'employee', label: 'Standard Employee' },
  ];

  const handleAddRow = () => {
    updateInvites([...invites, { email: '', role: 'admin' }]);
  };

  const handleRemoveRow = (index: number) => {
    const updated = invites.filter((_, i) => i !== index);
    updateInvites(updated);
  };

  const handleChangeEmail = (index: number, email: string) => {
    const updated = [...invites];
    updated[index].email = email;
    updateInvites(updated);
  };

  const handleChangeRole = (index: number, role: TeammateInvite['role']) => {
    const updated = [...invites];
    updated[index].role = role;
    updateInvites(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-[#ff7a59] shrink-0" />
          <span>Invite your leadership team or managers to your tenant workspace.</span>
        </div>
        <button
          type="button"
          onClick={onNext}
          className="text-xs text-[#ff7a59] font-semibold hover:text-[#ff8c70] transition-colors cursor-pointer shrink-0"
        >
          Skip for now →
        </button>
      </div>

      <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
        {invites.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
            <p className="text-xs text-slate-400">No pending teammate invites added yet.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddRow}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add First Teammate Invite
            </Button>
          </div>
        ) : (
          invites.map((invite, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <div className="flex-1 relative">
                <input
                  type="email"
                  placeholder="colleague@company.com"
                  value={invite.email}
                  onChange={(e) => handleChangeEmail(idx, e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs rounded-md px-3 py-2 pl-8 focus:outline-none focus:border-[#f0512f]"
                />
                <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              </div>

              <select
                value={invite.role}
                onChange={(e) => handleChangeRole(idx, e.target.value as TeammateInvite['role'])}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-md px-2.5 py-2 focus:outline-none focus:border-[#f0512f]"
              >
                {roleOptions.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => handleRemoveRow(idx)}
                className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                aria-label="Remove invite row"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {invites.length > 0 && (
        <button
          type="button"
          onClick={handleAddRow}
          className="text-xs text-[#ff7a59] hover:text-[#ff8c70] font-medium flex items-center gap-1.5 cursor-pointer py-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Add another teammate row
        </button>
      )}

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
          Review Workspace & Details →
        </Button>
      </div>
    </form>
  );
};
