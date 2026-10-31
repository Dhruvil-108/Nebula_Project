import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Network,
  Users,
  Building2,
  MapPin,
  Search,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Layers,
  ArrowRight,
  UserCheck,
  ExternalLink,
} from 'lucide-react';
import {
  useOrgChart,
  useDepartments,
  useBranches,
  useEmployee,
} from '../../hooks/useHrms';
import type { OrgChartNode } from '../../types/hrms';
import { FloatingDropdown } from '../../components/ui/FloatingDropdown';
import { Drawer } from '../../components/crm/Drawer';
import { InfoTile } from '../../components/hrms/InfoTile';
import { EmployeeStatusPill } from '../../components/hrms/HrmsStatusPill';

// ─────────────────────────────────────────────────────────
// Recursive Org Chart Node Component
// ─────────────────────────────────────────────────────────
interface TreeNodeProps {
  node: OrgChartNode;
  expandedIds: Set<string>;
  toggleNode: (id: string) => void;
  onSelectEmployee: (id: string) => void;
  searchQuery: string;
}

const OrgTreeNode: React.FC<TreeNodeProps> = ({
  node,
  expandedIds,
  toggleNode,
  onSelectEmployee,
  searchQuery,
}) => {
  const isExpanded = expandedIds.has(node._id);
  const hasChildren = node.children && node.children.length > 0;

  const matchesSearch =
    searchQuery.trim().length > 0 &&
    (node.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.designation.toLowerCase().includes(searchQuery.toLowerCase()));

  const initials = node.fullName
    ? node.fullName
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'EM';

  return (
    <div className="flex flex-col items-center">
      {/* ── Node Card ── */}
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        onClick={() => onSelectEmployee(node._id)}
        className={`group relative z-10 w-64 rounded-2xl p-4 transition-all duration-200 cursor-pointer text-left shadow-sm hover:shadow-md ${
          matchesSearch
            ? 'ring-2 ring-[#f97316] bg-[#fff7ed] border-[#fed7aa]'
            : 'bg-white border border-[#ECE0D6] hover:border-[#f97316]'
        }`}
      >
        {/* Top bar with avatar & grade */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#fff7ed] border border-[#fed7aa] text-[#ea580c] font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-2xs">
              {initials}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#1A1A1A] truncate group-hover:text-[#f97316] transition-colors">
                {node.fullName}
              </h4>
              <span className="text-[10px] font-mono font-semibold text-[#9B9B9B] block">
                {node.employeeCode}
              </span>
            </div>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#fff7ed] text-[#ea580c] border border-[#fed7aa] flex-shrink-0">
            {node.grade || 'L2'}
          </span>
        </div>

        {/* Role & Department */}
        <p className="text-xs font-semibold text-[#1A1A1A] truncate">{node.designation}</p>

        <div className="mt-2 pt-2 border-t border-[#F3EDE4] flex items-center justify-between text-[10px] text-[#6B6B6B]">
          <span className="truncate flex items-center gap-1">
            <Building2 className="w-3 h-3 text-[#f97316]" />
            {node.department?.name || 'General'}
          </span>
          {node.branch && (
            <span className="truncate flex items-center gap-0.5 font-medium">
              <MapPin className="w-2.5 h-2.5 text-[#ea580c]" />
              {node.branch.city || node.branch.name}
            </span>
          )}
        </div>

        {/* Direct reports counter pill / collapse button */}
        {hasChildren && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              toggleNode(node._id);
            }}
            className="mt-3 flex items-center justify-between px-2.5 py-1 rounded-lg bg-[#FBF8F4] border border-[#ECE0D6] hover:bg-[#fff7ed] hover:border-[#fed7aa] transition-colors cursor-pointer"
          >
            <span className="text-[10px] font-semibold text-[#ea580c]">
              {node.directReportCount} direct {node.totalReportCount > node.directReportCount ? `(${node.totalReportCount} team)` : ''}
            </span>
            <span className="text-[#6B6B6B]">
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </span>
          </div>
        )}
      </motion.div>

      {/* ── Sub-tree Connectors & Children ── */}
      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center"
          >
            {/* Vertical stem from parent */}
            <div className="w-0.5 h-6 bg-[#ECE0D6]" />

            {/* Horizontal branch bar */}
            {node.children.length > 1 && (
              <div
                className="h-0.5 bg-[#ECE0D6]"
                style={{
                  width: `calc(100% - ${256 / node.children.length}px)`,
                }}
              />
            )}

            {/* Child columns */}
            <div className="flex gap-6 pt-0">
              {node.children.map((child) => (
                <div key={child._id} className="flex flex-col items-center">
                  <div className="w-0.5 h-6 bg-[#ECE0D6]" />
                  <OrgTreeNode
                    node={child}
                    expandedIds={expandedIds}
                    toggleNode={toggleNode}
                    onSelectEmployee={onSelectEmployee}
                    searchQuery={searchQuery}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Main Interactive Org Chart Page
// ─────────────────────────────────────────────────────────
export const OrgChartPage: React.FC = () => {
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [search, setSearch] = useState('');
  const [zoom, setZoom] = useState(1);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const { data: orgData, isLoading, isError, refetch } = useOrgChart({
    departmentId: departmentFilter || undefined,
    branchId: branchFilter || undefined,
  });

  const { data: departments } = useDepartments();
  const { data: branches } = useBranches();
  const { data: selectedEmployee, isLoading: detailLoading } = useEmployee(selectedEmployeeId);

  // Initialize all nodes as expanded by default when orgData arrives
  React.useEffect(() => {
    if (orgData?.rootNodes) {
      const allIds = new Set<string>();
      const collect = (nodes: OrgChartNode[]) => {
        for (const n of nodes) {
          allIds.add(n._id);
          if (n.children && n.children.length > 0) {
            collect(n.children);
          }
        }
      };
      collect(orgData.rootNodes);
      setExpandedIds(allIds);
    }
  }, [orgData]);

  const toggleNode = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExpandAll = () => {
    if (!orgData?.rootNodes) return;
    const allIds = new Set<string>();
    const collect = (nodes: OrgChartNode[]) => {
      for (const n of nodes) {
        allIds.add(n._id);
        if (n.children) collect(n.children);
      }
    };
    collect(orgData.rootNodes);
    setExpandedIds(allIds);
  };

  const handleCollapseAll = () => {
    setExpandedIds(new Set());
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.15, 1.8));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.15, 0.4));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className="hrms-orgchart-page p-6 md:p-8 space-y-6 max-w-[1800px] mx-auto select-none">
      {/* ── Page Header & Hierarchy KPI Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">
              Enterprise Organizational Chart
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fff7ed] text-[#ea580c] border border-[#fed7aa]">
              Multi-Branch Hierarchy
            </span>
          </div>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Visual reporting tree, command structures, and team distribution across all office branches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#fff7ed] border border-[#ECE0D6] transition-colors cursor-pointer"
            title="Refresh Hierarchy"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleExpandAll}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-[#FBF8F4] text-[#1A1A1A] border border-[#ECE0D6] transition-colors cursor-pointer"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={handleCollapseAll}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-[#FBF8F4] text-[#1A1A1A] border border-[#ECE0D6] transition-colors cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </motion.div>

      {/* ── Hierarchy KPI Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-[#ECE0D6] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#6B6B6B] mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Headcount</span>
            <Users className="w-4 h-4 text-[#f97316]" />
          </div>
          <div className="text-2xl font-extrabold text-[#1A1A1A] font-mono">
            {isLoading ? '—' : orgData?.totalEmployees ?? 0}
          </div>
          <p className="text-[10px] text-[#6B6B6B] mt-0.5">Active personnel in tree</p>
        </div>

        <div className="rounded-2xl border border-[#ECE0D6] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#6B6B6B] mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Departments</span>
            <Building2 className="w-4 h-4 text-[#f97316]" />
          </div>
          <div className="text-2xl font-extrabold text-[#1A1A1A] font-mono">
            {isLoading ? '—' : orgData?.totalDepartments ?? 0}
          </div>
          <p className="text-[10px] text-[#6B6B6B] mt-0.5">Functional business units</p>
        </div>

        <div className="rounded-2xl border border-[#ECE0D6] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#6B6B6B] mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Branch Sites</span>
            <MapPin className="w-4 h-4 text-[#f97316]" />
          </div>
          <div className="text-2xl font-extrabold text-[#1A1A1A] font-mono">
            {isLoading ? '—' : orgData?.totalBranches ?? 0}
          </div>
          <p className="text-[10px] text-[#6B6B6B] mt-0.5">Physical office locations</p>
        </div>

        <div className="rounded-2xl border border-[#ECE0D6] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#6B6B6B] mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Hierarchy Depth</span>
            <Layers className="w-4 h-4 text-[#f97316]" />
          </div>
          <div className="text-2xl font-extrabold text-[#1A1A1A] font-mono">
            {isLoading ? '—' : `${orgData?.maxDepth ?? 1} tiers`}
          </div>
          <p className="text-[10px] text-[#6B6B6B] mt-0.5">Executive to team levels</p>
        </div>
      </div>

      {/* ── Filter Bar & Interactive Zoom Controls ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-[#ECE0D6] shadow-xs">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-[#9B9B9B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Find employee or role in chart..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#ECE0D6] bg-[#FBF8F4] pl-9 pr-3 py-1.5 text-xs text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316]"
            />
          </div>

          <FloatingDropdown
            value={departmentFilter}
            onChange={(val) => setDepartmentFilter(val)}
            options={[
              { value: '', label: 'All Departments' },
              ...(departments || []).map((d) => ({
                value: d._id,
                label: d.name,
              })),
            ]}
            fullWidth={false}
            className="sm:w-44"
          />

          <FloatingDropdown
            value={branchFilter}
            onChange={(val) => setBranchFilter(val)}
            options={[
              { value: '', label: 'All Branches' },
              ...(branches || []).map((b) => ({
                value: b._id,
                label: `${b.name} (${b.code})`,
              })),
            ]}
            fullWidth={false}
            className="sm:w-44"
          />
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1.5 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#ECE0D6] self-end sm:self-auto">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#fff7ed] border border-[#ECE0D6] transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-semibold text-[#6B6B6B] min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#fff7ed] border border-[#ECE0D6] transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#fff7ed] border border-[#ECE0D6] transition-colors cursor-pointer"
            title="Reset Zoom"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Org Chart Canvas Area ── */}
      <div className="relative rounded-2xl border border-[#ECE0D6] bg-[#FBF8F4] min-h-[620px] overflow-auto p-12 shadow-inner">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-28 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#f97316] animate-spin" />
            <p className="text-sm font-semibold text-[#1A1A1A]">Calculating organizational structure...</p>
          </div>
        ) : isError ? (
          <div className="text-center py-28">
            <p className="text-sm font-semibold text-[#DC2626]">Failed to generate organizational tree.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] text-white cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : !orgData?.rootNodes || orgData.rootNodes.length === 0 ? (
          <div className="text-center py-28">
            <Network className="w-12 h-12 text-[#E8DCCE] mx-auto mb-3" />
            <h4 className="text-base font-bold text-[#1A1A1A]">No Organizational Tree Data</h4>
            <p className="text-xs text-[#6B6B6B] mt-1">
              Add employees and assign reporting managers to visualize the reporting tree.
            </p>
          </div>
        ) : (
          <div
            className="flex justify-center items-start gap-16 transition-transform duration-200 origin-top"
            style={{ transform: `scale(${zoom})` }}
          >
            {orgData.rootNodes.map((root) => (
              <OrgTreeNode
                key={root._id}
                node={root}
                expandedIds={expandedIds}
                toggleNode={toggleNode}
                onSelectEmployee={(id) => setSelectedEmployeeId(id)}
                searchQuery={search}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── 360° Dossier Drawer on Card Selection ── */}
      <Drawer
        open={!!selectedEmployeeId}
        onClose={() => setSelectedEmployeeId(null)}
        title={selectedEmployee?.fullName || 'Employee Dossier'}
        subtitle={
          selectedEmployee
            ? [
                selectedEmployee.employeeCode,
                selectedEmployee.designation,
                selectedEmployee.grade ? `Grade ${selectedEmployee.grade}` : null,
                selectedEmployee.departmentId?.name,
              ]
                .filter(Boolean)
                .join(' · ')
            : undefined
        }
        width="lg"
      >
        {detailLoading || !selectedEmployee ? (
          <div className="space-y-4 p-4 animate-pulse">
            <div className="h-20 rounded-2xl bg-[#fff7ed]" />
            <div className="h-32 rounded-2xl bg-[#fff7ed]" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <InfoTile label="Email" value={selectedEmployee.email || '—'} />
              <InfoTile label="Phone" value={selectedEmployee.phone || '—'} />
              <InfoTile label="Department" value={selectedEmployee.departmentId?.name || '—'} />
              <InfoTile
                label="Branch Location"
                value={
                  selectedEmployee.branchId
                    ? `${selectedEmployee.branchId.name} (${selectedEmployee.branchId.code})`
                    : 'Headquarters'
                }
              />
              <InfoTile label="Designation" value={selectedEmployee.designation || 'Staff'} />
              <InfoTile label="Grade Level" value={selectedEmployee.grade || 'L2'} />
              <InfoTile label="Manager" value={selectedEmployee.managerId?.fullName || 'Root (Top-level)'} />
              <InfoTile
                label="Joined"
                value={selectedEmployee.joiningDate ? new Date(selectedEmployee.joiningDate).toLocaleDateString() : '—'}
              />
            </div>

            <div className="p-3.5 rounded-xl border border-[#ECE0D6] bg-[#FBF8F4] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider block mb-1">
                  Status
                </span>
                <EmployeeStatusPill status={selectedEmployee.status} />
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-[#f97316]">
                  {selectedEmployee.employeeCode}
                </span>
              </div>
            </div>

            {selectedEmployee.skills && selectedEmployee.skills.length > 0 && (
              <div className="p-3.5 rounded-xl border border-[#ECE0D6] bg-white">
                <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedEmployee.skills.map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-[#fff7ed] border border-[#fed7aa] text-[#ea580c] text-xs font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default OrgChartPage;
