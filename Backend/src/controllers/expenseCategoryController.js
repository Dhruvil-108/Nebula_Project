const ExpenseCategory = require('../models/ExpenseCategory');
const ExpenseClaim = require('../models/ExpenseClaim');

/**
 * Get all expense categories for the tenant
 */
exports.getCategories = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { activeOnly } = req.query;

    const filter = { organizationId: orgId };
    if (activeOnly === 'true') {
      filter.isActive = true;
    }

    const categories = await ExpenseCategory.find(filter)
      .sort({ name: 1 })
      .lean();

    // Attach count of claims using this category
    const categoriesWithStats = await Promise.all(
      categories.map(async (cat) => {
        const claimCount = await ExpenseClaim.countDocuments({
          organizationId: orgId,
          'items.categoryId': cat._id,
        });
        return { ...cat, claimCount };
      })
    );

    return res.json({ success: true, categories: categoriesWithStats });
  } catch (error) {
    console.error('Error fetching expense categories:', error);
    return res.status(500).json({ error: 'Failed to fetch expense categories.' });
  }
};

/**
 * Create a new expense category
 */
exports.createCategory = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const {
      name,
      code,
      glCode,
      icon,
      color,
      maxClaimLimit,
      isReceiptMandatory,
      receiptThresholdAmount,
      description,
    } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Category name and unique code are required.' });
    }

    const cleanCode = code.trim().toUpperCase();

    const existing = await ExpenseCategory.findOne({
      organizationId: orgId,
      code: cleanCode,
    });

    if (existing) {
      return res.status(409).json({ error: `Category code "${cleanCode}" is already in use.` });
    }

    const category = await ExpenseCategory.create({
      organizationId: orgId,
      name: name.trim(),
      code: cleanCode,
      glCode: glCode ? glCode.trim() : '',
      icon: icon || 'Receipt',
      color: color || '#f97316',
      maxClaimLimit: Number(maxClaimLimit) || 0,
      isReceiptMandatory: isReceiptMandatory !== undefined ? Boolean(isReceiptMandatory) : true,
      receiptThresholdAmount: Number(receiptThresholdAmount) || 25,
      description: description ? description.trim() : '',
      isActive: true,
    });

    return res.status(201).json({ success: true, category });
  } catch (error) {
    console.error('Error creating expense category:', error);
    return res.status(500).json({ error: error.message || 'Failed to create expense category.' });
  }
};

/**
 * Update an expense category
 */
exports.updateCategory = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;
    const updates = req.body;

    const category = await ExpenseCategory.findOne({ _id: id, organizationId: orgId });
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    if (updates.code) {
      const cleanCode = updates.code.trim().toUpperCase();
      if (cleanCode !== category.code) {
        const conflict = await ExpenseCategory.findOne({
          organizationId: orgId,
          code: cleanCode,
          _id: { $ne: id },
        });
        if (conflict) {
          return res.status(409).json({ error: `Category code "${cleanCode}" already exists.` });
        }
        category.code = cleanCode;
      }
    }

    if (updates.name !== undefined) category.name = updates.name.trim();
    if (updates.glCode !== undefined) category.glCode = updates.glCode.trim();
    if (updates.icon !== undefined) category.icon = updates.icon;
    if (updates.color !== undefined) category.color = updates.color;
    if (updates.maxClaimLimit !== undefined) category.maxClaimLimit = Number(updates.maxClaimLimit) || 0;
    if (updates.isReceiptMandatory !== undefined) category.isReceiptMandatory = Boolean(updates.isReceiptMandatory);
    if (updates.receiptThresholdAmount !== undefined) category.receiptThresholdAmount = Number(updates.receiptThresholdAmount) || 0;
    if (updates.isActive !== undefined) category.isActive = Boolean(updates.isActive);
    if (updates.description !== undefined) category.description = updates.description.trim();

    await category.save();

    return res.json({ success: true, category });
  } catch (error) {
    console.error('Error updating expense category:', error);
    return res.status(500).json({ error: error.message || 'Failed to update category.' });
  }
};

/**
 * Delete a category (if no claims use it)
 */
exports.deleteCategory = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;

    const usedCount = await ExpenseClaim.countDocuments({
      organizationId: orgId,
      'items.categoryId': id,
    });

    if (usedCount > 0) {
      return res.status(400).json({
        error: `Cannot delete category because it is referenced in ${usedCount} claim(s). Deactivate it instead.`,
      });
    }

    const deleted = await ExpenseCategory.findOneAndDelete({ _id: id, organizationId: orgId });
    if (!deleted) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    return res.json({ success: true, message: 'Category removed successfully.' });
  } catch (error) {
    console.error('Error deleting expense category:', error);
    return res.status(500).json({ error: 'Failed to delete category.' });
  }
};
