const Employee = require('../models/Employee');
const Department = require('../models/Department');
const BranchLocation = require('../models/BranchLocation');

// ─────────────────────────────────────────────────────────
// GET /api/v1/hr/org-chart
// ─────────────────────────────────────────────────────────
const getOrgChart = async (req, res) => {
  try {
    const { departmentId, branchId } = req.query;
    const filter = {
      organizationId: req.organizationId,
      status: 'active',
    };
    if (departmentId) filter.departmentId = departmentId;
    if (branchId) filter.branchId = branchId;

    const employees = await Employee.find(filter)
      .populate('departmentId', 'name')
      .populate('designationId', 'title code gradeLevel')
      .populate('branchId', 'name code city isHeadquarters')
      .lean();

    // Map employees by string ID
    const employeeMap = new Map();
    const childrenMap = new Map();

    for (const emp of employees) {
      const idStr = emp._id.toString();
      employeeMap.set(idStr, {
        _id: idStr,
        employeeCode: emp.employeeCode,
        fullName: emp.fullName,
        email: emp.email,
        phone: emp.phone,
        designation: emp.designation || emp.designationId?.title || 'Staff',
        grade: emp.grade || emp.designationId?.gradeLevel || 'L2',
        department: emp.departmentId ? { _id: emp.departmentId._id, name: emp.departmentId.name } : null,
        branch: emp.branchId ? { _id: emp.branchId._id, name: emp.branchId.name, city: emp.branchId.city } : null,
        managerId: emp.managerId ? emp.managerId.toString() : null,
        skills: emp.skills || [],
        directReportCount: 0,
        totalReportCount: 0,
        children: [],
      });
      childrenMap.set(idStr, []);
    }

    // Connect parents and children
    const rootNodes = [];

    for (const emp of employees) {
      const idStr = emp._id.toString();
      const node = employeeMap.get(idStr);
      const managerIdStr = emp.managerId ? emp.managerId.toString() : null;

      if (managerIdStr && employeeMap.has(managerIdStr)) {
        childrenMap.get(managerIdStr).push(node);
      } else {
        // No manager or manager not found in dataset -> Root node (e.g. CEO)
        rootNodes.push(node);
      }
    }

    // Recursive helper to populate children and compute counts and depth
    let maxDepth = 0;

    const buildSubTree = (node, depth = 1) => {
      if (depth > maxDepth) maxDepth = depth;
      const childNodes = childrenMap.get(node._id) || [];
      node.directReportCount = childNodes.length;
      node.children = childNodes;

      let subTotal = childNodes.length;
      for (const child of childNodes) {
        subTotal += buildSubTree(child, depth + 1);
      }
      node.totalReportCount = subTotal;
      return subTotal;
    };

    for (const root of rootNodes) {
      buildSubTree(root, 1);
    }

    const totalDepartments = await Department.countDocuments({ organizationId: req.organizationId });
    const totalBranches = await BranchLocation.countDocuments({ organizationId: req.organizationId });

    return res.json({
      rootNodes,
      totalEmployees: employees.length,
      totalDepartments,
      totalBranches,
      maxDepth,
    });
  } catch (err) {
    console.error('[orgChart.getOrgChart] Error:', err);
    return res.status(500).json({ error: 'Failed to generate organizational chart.' });
  }
};

module.exports = {
  getOrgChart,
};
