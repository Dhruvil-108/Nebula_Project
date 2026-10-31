const Goal = require('../models/Goal');
const ReviewCycle = require('../models/ReviewCycle');
const PerformanceReview = require('../models/PerformanceReview');
const AttritionRisk = require('../models/AttritionRisk');
const Employee = require('../models/Employee');
const PerformanceService = require('../services/performanceService');
const HrmsCopilotService = require('../services/hrmsCopilotService');

// ── GOALS & OKRS ──

exports.getGoals = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { employeeId, departmentId, status, period } = req.query;

    const query = { organizationId, deletedAt: null };
    if (employeeId) query.employeeId = employeeId;
    if (departmentId) query.departmentId = departmentId;
    if (status) query.status = status;
    if (period) query.period = period;

    const goals = await Goal.find(query)
      .populate({ path: 'employeeId', select: 'fullName employeeCode email avatar designation grade' })
      .populate({ path: 'departmentId', select: 'name' })
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: goals.length, data: goals });
  } catch (error) {
    console.error('getGoals error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGoalById = async (req, res) => {
  try {
    const { id } = req.params;
    const goal = await Goal.findOne({ _id: id, organizationId: req.user.organizationId, deletedAt: null })
      .populate({ path: 'employeeId', select: 'fullName employeeCode email avatar designation grade' })
      .populate({ path: 'departmentId', select: 'name' })
      .populate({ path: 'checkIns.updatedBy', select: 'fullName email' });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    return res.json({ success: true, data: goal });
  } catch (error) {
    console.error('getGoalById error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createGoal = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const {
      employeeId,
      departmentId,
      title,
      description,
      category,
      level,
      period,
      startDate,
      dueDate,
      weight,
      keyResults,
    } = req.body;

    if (!employeeId || !title || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'employeeId, title, and dueDate are required',
      });
    }

    const progress = PerformanceService.calculateGoalProgress(keyResults);

    const goal = await Goal.create({
      organizationId,
      employeeId,
      departmentId: departmentId || null,
      title,
      description: description || '',
      category: category || 'general',
      level: level || 'individual',
      period: period || '2026 Annual',
      startDate: startDate || new Date(),
      dueDate,
      weight: weight || 10,
      progress,
      status: progress >= 100 ? 'completed' : 'in_progress',
      keyResults: keyResults || [],
      checkIns: [
        {
          note: 'Goal initialized',
          progressSnapshot: progress,
          updatedBy: req.user._id,
        },
      ],
    });

    const populated = await Goal.findById(goal._id)
      .populate({ path: 'employeeId', select: 'fullName employeeCode email avatar designation grade' })
      .populate({ path: 'departmentId', select: 'name' });

    return res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('createGoal error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const goal = await Goal.findOne({ _id: id, organizationId, deletedAt: null });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    const updates = req.body;
    if (updates.title) goal.title = updates.title;
    if (updates.description !== undefined) goal.description = updates.description;
    if (updates.category) goal.category = updates.category;
    if (updates.level) goal.level = updates.level;
    if (updates.period) goal.period = updates.period;
    if (updates.dueDate) goal.dueDate = updates.dueDate;
    if (updates.status) goal.status = updates.status;
    if (updates.keyResults) {
      goal.keyResults = updates.keyResults;
      goal.progress = PerformanceService.calculateGoalProgress(updates.keyResults);
      if (goal.progress >= 100 && goal.status !== 'cancelled') {
        goal.status = 'completed';
      }
    }

    await goal.save();

    const populated = await Goal.findById(goal._id)
      .populate({ path: 'employeeId', select: 'fullName employeeCode email avatar designation grade' })
      .populate({ path: 'departmentId', select: 'name' });

    return res.json({ success: true, data: populated });
  } catch (error) {
    console.error('updateGoal error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.addGoalCheckIn = async (req, res) => {
  try {
    const { id } = req.params;
    const { note, progress, keyResults } = req.body;
    const organizationId = req.user.organizationId;

    const goal = await Goal.findOne({ _id: id, organizationId, deletedAt: null });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    if (keyResults) {
      goal.keyResults = keyResults;
      goal.progress = PerformanceService.calculateGoalProgress(keyResults);
    } else if (progress !== undefined) {
      goal.progress = Math.min(100, Math.max(0, Number(progress)));
    }

    if (goal.progress >= 100 && goal.status !== 'cancelled') {
      goal.status = 'completed';
    }

    goal.checkIns.push({
      note: note || 'Progress check-in',
      progressSnapshot: goal.progress,
      updatedBy: req.user._id,
      date: new Date(),
    });

    await goal.save();

    return res.json({ success: true, data: goal });
  } catch (error) {
    console.error('addGoalCheckIn error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const goal = await Goal.findOneAndUpdate(
      { _id: id, organizationId: req.user.organizationId },
      { deletedAt: new Date() },
      { new: true }
    );
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }
    return res.json({ success: true, message: 'Goal archived successfully' });
  } catch (error) {
    console.error('deleteGoal error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── REVIEW CYCLES & APPRAISALS ──

exports.getReviewCycles = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const cycles = await ReviewCycle.find({ organizationId }).sort({ createdAt: -1 });
    return res.json({ success: true, count: cycles.length, data: cycles });
  } catch (error) {
    console.error('getReviewCycles error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createReviewCycle = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { name, description, reviewPeriod, startDate, endDate, dueDate, type, eligibleDepartments } = req.body;

    if (!name || !startDate || !endDate || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'name, startDate, endDate, and dueDate are required',
      });
    }

    // Determine eligible employees
    const empQuery = { organizationId, status: 'active' };
    if (eligibleDepartments && eligibleDepartments.length > 0) {
      empQuery.departmentId = { $in: eligibleDepartments };
    }

    const employees = await Employee.find(empQuery).select('_id managerId');

    const cycle = await ReviewCycle.create({
      organizationId,
      name,
      description: description || '',
      reviewPeriod: reviewPeriod || 'annual',
      startDate,
      endDate,
      dueDate,
      status: 'active',
      type: type || '360_degree',
      eligibleDepartments: eligibleDepartments || [],
      submissionStats: {
        totalEligible: employees.length,
        completed: 0,
        pending: employees.length,
      },
      createdBy: req.user._id,
    });

    // Automatically spawn draft reviews for eligible employees
    const reviewsToCreate = [];
    for (const emp of employees) {
      reviewsToCreate.push({
        organizationId,
        reviewCycleId: cycle._id,
        employeeId: emp._id,
        managerId: emp.managerId || emp._id,
        status: 'pending_self',
      });
    }

    if (reviewsToCreate.length > 0) {
      await PerformanceReview.insertMany(reviewsToCreate);
    }

    return res.status(201).json({ success: true, data: cycle });
  } catch (error) {
    console.error('createReviewCycle error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { reviewCycleId, employeeId, managerId, status } = req.query;

    const query = { organizationId };
    if (reviewCycleId) query.reviewCycleId = reviewCycleId;
    if (employeeId) query.employeeId = employeeId;
    if (managerId) query.managerId = managerId;
    if (status) query.status = status;

    const reviews = await PerformanceReview.find(query)
      .populate({
        path: 'employeeId',
        select: 'fullName employeeCode email avatar designation grade departmentId',
        populate: { path: 'departmentId', select: 'name' },
      })
      .populate({ path: 'managerId', select: 'fullName employeeCode email avatar' })
      .populate({ path: 'reviewCycleId', select: 'name reviewPeriod dueDate status' })
      .sort({ updatedAt: -1 });

    return res.json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    console.error('getReviews error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getReviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await PerformanceReview.findOne({ _id: id, organizationId: req.user.organizationId })
      .populate({
        path: 'employeeId',
        select: 'fullName employeeCode email avatar designation grade departmentId',
        populate: { path: 'departmentId', select: 'name' },
      })
      .populate({ path: 'managerId', select: 'fullName employeeCode email avatar' })
      .populate({ path: 'reviewCycleId', select: 'name reviewPeriod dueDate status' })
      .populate({ path: 'peerReviews.reviewerId', select: 'fullName employeeCode designation' });

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    return res.json({ success: true, data: review });
  } catch (error) {
    console.error('getReviewById error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.submitSelfReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { summary, strengths, growthAreas, achievements, rating } = req.body;
    const organizationId = req.user.organizationId;

    const review = await PerformanceReview.findOne({ _id: id, organizationId });
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    review.selfReview = {
      summary: summary || '',
      strengths: strengths || '',
      growthAreas: growthAreas || '',
      achievements: achievements || '',
      rating: rating ? Number(rating) : 3,
      submittedAt: new Date(),
    };

    if (review.status === 'pending_self') {
      review.status = 'pending_manager';
    }

    await review.save();

    return res.json({ success: true, data: review });
  } catch (error) {
    console.error('submitSelfReview error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.submitManagerReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { summary, strengths, growthAreas, rating, potentialRating, recommendations } = req.body;
    const organizationId = req.user.organizationId;

    const review = await PerformanceReview.findOne({ _id: id, organizationId });
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const perfScore = rating ? Math.max(1, Math.min(3, Math.round((Number(rating) / 5) * 3))) : 2;
    const potScore = potentialRating ? Number(potentialRating) : 2;
    const boxLabel = PerformanceService.get9BoxLabel(perfScore, potScore);

    review.managerReview = {
      summary: summary || '',
      strengths: strengths || '',
      growthAreas: growthAreas || '',
      rating: rating ? Number(rating) : 3,
      potentialRating: potScore,
      recommendations: recommendations || '',
      submittedAt: new Date(),
    };

    review.calibration.nineBoxGrid = {
      performanceScore: perfScore,
      potentialScore: potScore,
      boxLabel,
    };

    review.status = 'in_calibration';
    await review.save();

    return res.json({ success: true, data: review });
  } catch (error) {
    console.error('submitManagerReview error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.calibrateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { performanceScore, potentialScore, promotionRecommended, salaryIncrementPercentage, calibrationNotes } = req.body;
    const organizationId = req.user.organizationId;

    const review = await PerformanceReview.findOne({ _id: id, organizationId });
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const p = Number(performanceScore || review.calibration.nineBoxGrid.performanceScore || 2);
    const pot = Number(potentialScore || review.calibration.nineBoxGrid.potentialScore || 2);
    const boxLabel = PerformanceService.get9BoxLabel(p, pot);

    review.calibration = {
      nineBoxGrid: {
        performanceScore: p,
        potentialScore: pot,
        boxLabel,
      },
      promotionRecommended: Boolean(promotionRecommended),
      salaryIncrementPercentage: Number(salaryIncrementPercentage || 0),
      calibrationNotes: calibrationNotes || '',
      calibratedBy: req.user._id,
      calibratedAt: new Date(),
    };

    review.status = 'completed';
    review.completedAt = new Date();
    await review.save();

    // Update cycle submission counts
    const cycle = await ReviewCycle.findById(review.reviewCycleId);
    if (cycle) {
      const completedCount = await PerformanceReview.countDocuments({
        reviewCycleId: cycle._id,
        status: 'completed',
      });
      cycle.submissionStats.completed = completedCount;
      cycle.submissionStats.pending = Math.max(0, cycle.submissionStats.totalEligible - completedCount);
      await cycle.save();
    }

    return res.json({ success: true, data: review });
  } catch (error) {
    console.error('calibrateReview error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── 9-BOX TALENT MATRIX ──

exports.getNineBoxGrid = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { departmentId } = req.query;
    const grid = await PerformanceService.getNineBoxGrid(organizationId, departmentId);
    return res.json({ success: true, data: grid });
  } catch (error) {
    console.error('getNineBoxGrid error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── ATTRITION RISK RADAR ──

exports.getAttritionRisks = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { riskLevel } = req.query;

    const query = { organizationId };
    if (riskLevel) query.riskLevel = riskLevel;

    let risks = await AttritionRisk.find(query)
      .populate({
        path: 'employeeId',
        select: 'fullName employeeCode email avatar departmentId designation grade',
        populate: { path: 'departmentId', select: 'name' },
      })
      .sort({ riskScore: -1 });

    // Auto-bootstrap if empty
    if (risks.length === 0) {
      await PerformanceService.computeAllAttritionRisks(organizationId);
      risks = await AttritionRisk.find(query)
        .populate({
          path: 'employeeId',
          select: 'fullName employeeCode email avatar departmentId designation grade',
          populate: { path: 'departmentId', select: 'name' },
        })
        .sort({ riskScore: -1 });
    }

    return res.json({ success: true, count: risks.length, data: risks });
  } catch (error) {
    console.error('getAttritionRisks error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.recomputeAttritionRisks = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const results = await PerformanceService.computeAllAttritionRisks(organizationId);
    return res.json({ success: true, count: results.length, message: 'Attrition risks recomputed successfully' });
  } catch (error) {
    console.error('recomputeAttritionRisks error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── HR AI COPILOT ──

exports.queryCopilot = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, message: 'prompt is required' });
    }

    const copilotResult = await HrmsCopilotService.queryCopilot(organizationId, req.user, prompt);
    return res.json({ success: true, data: copilotResult });
  } catch (error) {
    console.error('queryCopilot error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
