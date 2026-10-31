const mongoose = require('mongoose');
const ApprovalInstance = require('../models/ApprovalInstance');
const ApprovalWorkflow = require('../models/ApprovalWorkflow');
const Employee = require('../models/Employee');
const Department = require('../models/Department');
const User = require('../models/User');

/**
 * Generic Approval Workflow Engine
 * Reusable engine for Leave, Regularizations, Expenses, Payroll, Transfers.
 */

/**
 * Resolves the appropriate approver user ID for a step rule.
 */
async function resolveApproverForRule(organizationId, approverType, requesterEmployee, specificUserId) {
  if (approverType === 'specific_user' && specificUserId) {
    return { approverUserId: specificUserId, approverRole: null };
  }

  if (approverType === 'manager') {
    if (requesterEmployee?.managerId) {
      const manager = await Employee.findById(requesterEmployee.managerId).select('userId fullName email').lean();
      if (manager?.userId) {
        return { approverUserId: manager.userId, approverRole: 'manager' };
      }
    }
    // Fallback: If no manager found, route to HR role
    return { approverUserId: null, approverRole: 'hr' };
  }

  if (approverType === 'dept_head') {
    if (requesterEmployee?.departmentId) {
      const dept = await Department.findById(requesterEmployee.departmentId).populate('headId', 'userId').lean();
      if (dept?.headId?.userId) {
        return { approverUserId: dept.headId.userId, approverRole: 'manager' };
      }
    }
    return { approverUserId: null, approverRole: 'hr' };
  }

  if (approverType === 'hr') {
    return { approverUserId: null, approverRole: 'hr' };
  }

  if (approverType === 'finance') {
    return { approverUserId: null, approverRole: 'finance' };
  }

  return { approverUserId: null, approverRole: 'admin' };
}

/**
 * Starts a new approval workflow instance for a request.
 */
async function startApproval({
  organizationId,
  requestType,
  referenceId,
  referenceModel = 'LeaveRequest',
  requesterEmployeeId,
  requesterUserId,
  metadata = {},
}) {
  const employee = await Employee.findOne({ _id: requesterEmployeeId, organizationId }).lean();

  // Try to find configured workflow for this requestType
  const workflow = await ApprovalWorkflow.findOne({
    organizationId,
    name: { $regex: new RegExp(requestType, 'i') },
  }).lean();

  let steps = [];

  if (workflow && workflow.steps && workflow.steps.length > 0) {
    for (const step of workflow.steps) {
      const { approverUserId, approverRole } = await resolveApproverForRule(
        organizationId,
        step.approverType,
        employee,
        step.specificUserId
      );

      steps.push({
        stepOrder: step.stepOrder,
        approverType: step.approverType,
        approverUserId,
        approverRole,
        status: step.stepOrder === 1 ? 'pending' : 'pending',
      });
    }
  } else {
    // Default 1-step rule: Reporting Manager or HR
    const { approverUserId, approverRole } = await resolveApproverForRule(
      organizationId,
      'manager',
      employee,
      null
    );

    steps = [
      {
        stepOrder: 1,
        approverType: 'manager',
        approverUserId,
        approverRole,
        status: 'pending',
      },
    ];
  }

  const slaHours = 48;
  const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

  const instance = await ApprovalInstance.create({
    organizationId,
    requestType,
    referenceId,
    referenceModel,
    workflowId: workflow?._id || null,
    requesterEmployeeId,
    requesterUserId: requesterUserId || employee?.userId || null,
    currentStepIndex: 0,
    status: 'pending',
    steps,
    slaDeadline,
    metadata,
  });

  return instance;
}

/**
 * Acts on a step in the approval instance (approve, reject, send_back).
 */
async function actOnStep({
  organizationId,
  instanceId,
  referenceId,
  actorUserId,
  actorRole,
  action,
  comments = '',
}) {
  let instance;
  if (instanceId) {
    instance = await ApprovalInstance.findOne({ _id: instanceId, organizationId });
  } else if (referenceId) {
    instance = await ApprovalInstance.findOne({ referenceId, organizationId }).sort({ createdAt: -1 });
  }

  if (!instance) {
    throw new Error('Approval workflow instance not found.');
  }

  if (instance.status !== 'pending') {
    return {
      instance,
      isComplete: true,
      finalStatus: instance.status,
      message: `Instance is already ${instance.status}.`,
    };
  }

  const currentStep = instance.steps[instance.currentStepIndex];
  if (!currentStep) {
    throw new Error('Current workflow step not found.');
  }

  // Permission check
  const isDirectApprover = currentStep.approverUserId?.toString() === actorUserId?.toString();
  const hasRoleMatch = currentStep.approverRole && (actorRole === currentStep.approverRole || actorRole === 'admin' || actorRole === 'super_admin');
  const isAdminOverride = ['admin', 'super_admin'].includes(actorRole);

  if (!isDirectApprover && !hasRoleMatch && !isAdminOverride) {
    throw new Error('You are not authorized to act on this approval step.');
  }

  currentStep.actedAt = new Date();
  currentStep.actionBy = actorUserId;
  currentStep.comments = comments || '';

  if (action === 'reject') {
    currentStep.status = 'rejected';
    instance.status = 'rejected';
    instance.completedAt = new Date();
    await instance.save();
    return { instance, isComplete: true, finalStatus: 'rejected' };
  }

  if (action === 'approve') {
    currentStep.status = 'approved';

    // Check if more steps remain
    if (instance.currentStepIndex + 1 < instance.steps.length) {
      instance.currentStepIndex += 1;
      instance.steps[instance.currentStepIndex].status = 'pending';
      await instance.save();
      return { instance, isComplete: false, finalStatus: 'pending' };
    }

    // Final approval reached
    instance.status = 'approved';
    instance.completedAt = new Date();
    await instance.save();
    return { instance, isComplete: true, finalStatus: 'approved' };
  }

  throw new Error(`Invalid action "${action}". Allowed: approve, reject.`);
}

/**
 * Retrieves the pending inbox for a given user.
 */
async function getInbox({ organizationId, userId, userRole }) {
  const query = {
    organizationId,
    status: 'pending',
    $or: [
      { 'steps.approverUserId': userId },
      { 'steps.approverRole': userRole },
    ],
  };

  if (['admin', 'super_admin'].includes(userRole)) {
    // Admins see all pending approvals
    delete query.$or;
  }

  const instances = await ApprovalInstance.find(query)
    .populate('requesterEmployeeId', 'fullName employeeCode designation departmentId')
    .sort({ createdAt: -1 })
    .lean();

  return instances;
}

module.exports = {
  startApproval,
  actOnStep,
  getInbox,
};
