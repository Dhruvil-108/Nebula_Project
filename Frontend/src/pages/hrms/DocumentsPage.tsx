import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  RefreshCw,
  Trash2,
  Loader2,
  Upload,
  User,
  X,
  Download,
} from 'lucide-react';
import {
  useEmployees,
  useEmployeeDocuments,
  useUploadEmployeeDocument,
  useDeleteEmployeeDocument,
} from '../../hooks/useHrms';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { useAuth } from '../../contexts/AuthContext';
import { DOC_TYPES, DOC_TYPE_LABELS, type DocType } from '../../types/hrms';

export const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const { can } = useModuleAccess('hrms');
  const canUpload = can('create');
  const canDelete = can('delete');
  const isManagement = ['super_admin', 'admin', 'manager', 'hr'].includes(user?.role || '');

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState<{ docType: DocType; fileName: string; fileUrl: string }>({
    docType: 'other',
    fileName: '',
    fileUrl: '',
  });

  const { data: employees } = useEmployees();

  // Employees see only their own record — default the picker to themselves
  const ownEmployee = useMemo(
    () => (employees || []).find((e) => e.userId?._id === user?.id),
    [employees, user?.id]
  );

  React.useEffect(() => {
    if (!selectedEmployeeId) {
      if (ownEmployee) setSelectedEmployeeId(ownEmployee._id);
      else if (isManagement && (employees || []).length > 0) setSelectedEmployeeId(employees![0]._id);
    }
  }, [ownEmployee, employees, isManagement, selectedEmployeeId]);

  const { data: documents, isLoading } = useEmployeeDocuments(selectedEmployeeId || null);

  const uploadMutation = useUploadEmployeeDocument();
  const deleteMutation = useDeleteEmployeeDocument();

  const visibleEmployees = isManagement ? employees || [] : ownEmployee ? [ownEmployee] : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fileName.trim() || !form.fileUrl.trim() || !selectedEmployeeId) return;
    uploadMutation.mutate(
      { employeeId: selectedEmployeeId, input: form },
      {
        onSuccess: () => {
          setShowUpload(false);
          setForm({ docType: 'other', fileName: '', fileUrl: '' });
        },
      }
    );
  };

  const inputCls =
    'w-full rounded-lg border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316] transition-all';

  return (
    <div className="hrms-submodule-page p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">Documents</h2>
          <p className="text-sm text-[#6B6B6B] mt-1">
            {isLoading
              ? 'Loading documents...'
              : `${documents?.length ?? 0} document${(documents?.length ?? 0) === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isManagement && (
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="rounded-lg border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316] transition-all sm:w-56"
            >
              {(visibleEmployees.length === 0 ? [{ _id: '', fullName: 'No employees' }] : visibleEmployees).map(
                (emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.fullName}
                  </option>
                )
              )}
            </select>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#fff7ed] border border-[#ECE0D6] transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {canUpload && selectedEmployeeId && (
            <button
              type="button"
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md shadow-[#f97316]/20 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Document
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Document list ── */}
      <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4] text-[11px] uppercase tracking-wider text-[#6B6B6B]">
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">File</th>
                <th className="px-5 py-3 font-semibold">Uploaded</th>
                <th className="px-5 py-3 font-semibold">Uploader</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3EDE4]">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-5 py-4">
                      <div className="h-5 rounded bg-[#fff7ed] animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : !selectedEmployeeId ? (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center">
                    <User className="w-10 h-10 text-[#E8DCCE] mx-auto mb-3" />
                    <p className="text-sm font-medium text-[#1A1A1A]">No employee record linked to your account</p>
                    <p className="text-xs text-[#6B6B6B] mt-1">Ask HR to create your employee record.</p>
                  </td>
                </tr>
              ) : (documents || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center">
                    <FileText className="w-10 h-10 text-[#E8DCCE] mx-auto mb-3" />
                    <p className="text-sm font-medium text-[#1A1A1A]">No documents uploaded</p>
                    <p className="text-xs text-[#6B6B6B] mt-1">
                      {canUpload ? 'Upload the first document for this employee.' : 'Documents will appear here once uploaded.'}
                    </p>
                  </td>
                </tr>
              ) : (
                (documents || []).map((doc, idx) => (
                  <motion.tr
                    key={doc._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.3), duration: 0.25 }}
                    className="hover:bg-[#FBF8F4] transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#fff7ed] text-[#ea580c] text-xs font-semibold">
                        {DOC_TYPE_LABELS[doc.docType]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-[#f97316] hover:underline inline-flex items-center gap-1.5"
                      >
                        {doc.fileName}
                        <Download className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#6B6B6B] font-mono">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-[#6B6B6B]">{doc.uploadedBy?.fullName || '—'}</td>
                    <td className="px-5 py-3.5 text-right">
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate({ id: doc._id, employeeId: selectedEmployeeId })}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors disabled:opacity-50"
                          title="Delete document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Upload modal ── */}
      {canUpload && showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={() => setShowUpload(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-md rounded-2xl bg-white border border-[#ECE0D6] shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECE0D6]">
              <h3 className="text-base font-semibold text-[#1A1A1A]">Upload Document</h3>
              <button
                type="button"
                onClick={() => setShowUpload(false)}
                className="p-1.5 rounded-lg text-[#6B6B6B] hover:bg-[#fff7ed] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">
                  Document type <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  value={form.docType}
                  onChange={(e) => setForm({ ...form, docType: e.target.value as DocType })}
                  className={inputCls}
                >
                  {DOC_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {DOC_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">
                  File name <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  required
                  value={form.fileName}
                  onChange={(e) => setForm({ ...form, fileName: e.target.value })}
                  className={inputCls}
                  placeholder="e.g. passport.pdf"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">
                  File URL <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  required
                  value={form.fileUrl}
                  onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                  className={inputCls}
                  placeholder="https://storage.example.com/documents/passport.pdf"
                />
                <p className="text-[10px] text-[#9B9B9B] mt-1">
                  Link to the stored file (S3, Drive, or your storage provider).
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUpload(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] border border-[#ECE0D6] hover:bg-[#fff7ed] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadMutation.isPending || !form.fileName.trim() || !form.fileUrl.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white transition-colors disabled:opacity-50"
                >
                  {uploadMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Upload
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
