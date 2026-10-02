import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Building2, X } from 'lucide-react';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({ isOpen, onClose }) => {
  const { addClient, profiles } = useData();

  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [industry, setIndustry] = useState('');
  const [notes, setNotes] = useState('');
  const [assignedPmId, setAssignedPmId] = useState(
    profiles.find((p) => p.role === 'project_manager')?.id || ''
  );
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!companyName.trim() || !contactPerson.trim() || !email.trim()) {
      setFormError('Please fill out all required fields (Company name, contact person, email).');
      return;
    }

    addClient({
      company_name: companyName.trim(),
      contact_person: contactPerson.trim(),
      email: email.trim(),
      phone: phone.trim() || '+1 (555) 000-0000',
      address: address.trim(),
      industry: industry.trim() || 'Digital Marketing & Commerce',
      notes: notes.trim(),
      status: 'active',
      assigned_pm_id: assignedPmId || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden my-auto sm:my-6 max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-4 sm:px-6 py-3 sm:py-4 bg-neutral-950 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-neutral-100 truncate">Add New Client Account</h2>
              <p className="text-xs text-neutral-400 truncate">Onboard a client brand to Zero Hub</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs flex-1 overflow-y-auto">
          {formError && (
            <div className="rounded-lg border border-rose-800/80 bg-rose-950/40 p-2.5 text-xs text-rose-300">
              {formError}
            </div>
          )}
          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Company Name *
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Apex Hyperwear Ltd"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:border-amber-400 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">
                Lead Contact Person *
              </label>
              <input
                type="text"
                required
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. David Miller"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:border-amber-400 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-neutral-300 font-medium mb-1">
                Industry / Sector *
              </label>
              <input
                type="text"
                required
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Luxury Footwear & Retail"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:border-amber-400 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. david@apexwear.com"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:border-amber-400 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-neutral-300 font-medium mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 012-3456"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:border-amber-400 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">
                Headquarters Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 500 Broadway, New York, NY"
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-100 placeholder-neutral-600 focus:border-amber-400 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-neutral-300 font-medium mb-1">
                Assigned Project Manager
              </label>
              <select
                value={assignedPmId}
                onChange={(e) => setAssignedPmId(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-200 focus:border-amber-400 focus:outline-hidden"
              >
                <option value="">Unassigned</option>
                {profiles
                  .filter((p) => p.role === 'project_manager' || p.role === 'super_admin')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.role.replace('_', ' ')})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Creative Brand Notes & Preferences
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Brand aesthetics, target demographics, delivery turnaround rules, social handles..."
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-neutral-100 placeholder-neutral-600 focus:border-amber-400 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-amber-400 px-4 py-2 font-semibold text-neutral-950 hover:bg-amber-300 transition-colors"
            >
              Save Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
