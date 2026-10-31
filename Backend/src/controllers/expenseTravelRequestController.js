const TravelRequest = require('../models/TravelRequest');
const travelRequestService = require('../services/travelRequestService');

/**
 * List Travel Requests
 */
exports.getTravelRequests = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { status, employeeId, departmentId, search } = req.query;

    const query = { organizationId: orgId, deletedAt: null };

    if (status) query.status = status;
    if (employeeId) query.employeeId = employeeId;
    if (departmentId) query.departmentId = departmentId;
    if (search) {
      query.$or = [
        { requestNumber: new RegExp(search, 'i') },
        { destination: new RegExp(search, 'i') },
        { purpose: new RegExp(search, 'i') },
      ];
    }

    const requests = await TravelRequest.find(query)
      .populate('employeeId', 'fullName email')
      .populate('departmentId', 'name')
      .populate('projectId', 'name code')
      .populate('costCenterId', 'name code')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, count: requests.length, travelRequests: requests });
  } catch (error) {
    console.error('Error fetching travel requests:', error);
    return res.status(500).json({ error: 'Failed to fetch travel requests.' });
  }
};

/**
 * Get Single Travel Request
 */
exports.getTravelRequestById = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;

    const request = await TravelRequest.findOne({
      _id: id,
      organizationId: orgId,
      deletedAt: null,
    })
      .populate('employeeId', 'fullName email')
      .populate('departmentId', 'name')
      .populate('projectId', 'name code')
      .populate('costCenterId', 'name code')
      .populate('approval.approvedById', 'fullName email')
      .populate('rejection.rejectedById', 'fullName email');

    if (!request) {
      return res.status(404).json({ error: 'Travel request not found.' });
    }

    return res.json({ success: true, travelRequest: request });
  } catch (error) {
    console.error('Error fetching travel request:', error);
    return res.status(500).json({ error: 'Failed to fetch travel request.' });
  }
};

/**
 * Create Travel Request
 */
exports.createTravelRequest = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const employeeId = req.user?._id;

    const request = await travelRequestService.createTravelRequest({
      organizationId: orgId,
      employeeId,
      ...req.body,
    });

    return res.status(201).json({ success: true, travelRequest: request });
  } catch (error) {
    console.error('Error creating travel request:', error);
    return res.status(400).json({ error: error.message || 'Failed to create travel request.' });
  }
};

/**
 * Approve Travel Request (Anti-self-approval enforced)
 */
exports.approveTravelRequest = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const approverId = req.user?._id;
    const { id } = req.params;
    const { comments } = req.body;

    const request = await travelRequestService.approveTravelRequest({
      travelRequestId: id,
      organizationId: orgId,
      approverId,
      comments,
    });

    return res.json({ success: true, travelRequest: request });
  } catch (error) {
    console.error('Error approving travel request:', error);
    return res.status(400).json({ error: error.message || 'Failed to approve travel request.' });
  }
};

/**
 * Reject Travel Request
 */
exports.rejectTravelRequest = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const approverId = req.user?._id;
    const { id } = req.params;
    const { reason } = req.body;

    const request = await travelRequestService.rejectTravelRequest({
      travelRequestId: id,
      organizationId: orgId,
      approverId,
      reason,
    });

    return res.json({ success: true, travelRequest: request });
  } catch (error) {
    console.error('Error rejecting travel request:', error);
    return res.status(400).json({ error: error.message || 'Failed to reject travel request.' });
  }
};

/**
 * Soft delete Travel Request
 */
exports.deleteTravelRequest = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;

    const request = await TravelRequest.findOneAndUpdate(
      { _id: id, organizationId: orgId, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ error: 'Travel request not found.' });
    }

    return res.json({ success: true, message: 'Travel request deleted successfully.' });
  } catch (error) {
    console.error('Error deleting travel request:', error);
    return res.status(500).json({ error: 'Failed to delete travel request.' });
  }
};
