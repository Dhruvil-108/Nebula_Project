const ItemCategory = require('../models/ItemCategory');
const Item = require('../models/Item');
const AuditLog = require('../models/AuditLog');

/**
 * Get all item categories (flat and hierarchical tree support)
 */
exports.getCategories = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { activeOnly = 'true' } = req.query;

    const filter = { organizationId: orgId };
    if (activeOnly === 'true') {
      filter.active = true;
    }

    const categories = await ItemCategory.find(filter)
      .populate('parentId', 'name code')
      .sort({ name: 1 })
      .lean();

    // Attach item counts
    const categoriesWithStats = await Promise.all(
      categories.map(async (cat) => {
        const itemCount = await Item.countDocuments({
          organizationId: orgId,
          categoryId: cat._id,
        });
        return { ...cat, itemCount };
      })
    );

    return res.json({ success: true, categories: categoriesWithStats });
  } catch (error) {
    console.error('Error in getCategories:', error);
    return res.status(500).json({ error: 'Failed to fetch categories.' });
  }
};

/**
 * Create Category
 */
exports.createCategory = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { name, code, parentId = null, description = '' } = req.body;

    if (!name || !code) {
      return res.status(400).json({ error: 'Category name and code are required.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await ItemCategory.findOne({ organizationId: orgId, code: cleanCode });
    if (existing) {
      return res.status(409).json({ error: `Category code "${cleanCode}" already exists.` });
    }

    const category = await ItemCategory.create({
      organizationId: orgId,
      name: name.trim(),
      code: cleanCode,
      parentId: parentId || null,
      description: description.trim(),
      active: true,
    });

    await AuditLog.create({
      organizationId: orgId,
      actor: req.user._id,
      action: 'item_category_created',
      entity: 'ItemCategory',
      entityId: category._id,
      metadata: { code: category.code, name: category.name },
    }).catch((e) => console.warn('AuditLog error:', e.message));

    return res.status(201).json({ success: true, category });
  } catch (error) {
    console.error('Error in createCategory:', error);
    return res.status(500).json({ error: error.message || 'Failed to create category.' });
  }
};

/**
 * Update Category
 */
exports.updateCategory = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;
    const { name, parentId, description, active } = req.body;

    const category = await ItemCategory.findOne({ _id: id, organizationId: orgId });
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    if (name) category.name = name.trim();
    if (parentId !== undefined) {
      // Prevent circular parent reference
      if (parentId && parentId.toString() === id.toString()) {
        return res.status(400).json({ error: 'Category cannot be its own parent.' });
      }
      category.parentId = parentId || null;
    }
    if (description !== undefined) category.description = description.trim();
    if (active !== undefined) category.active = Boolean(active);

    await category.save();

    await AuditLog.create({
      organizationId: orgId,
      actor: req.user._id,
      action: 'item_category_updated',
      entity: 'ItemCategory',
      entityId: category._id,
      metadata: { code: category.code, name: category.name },
    }).catch((e) => console.warn('AuditLog error:', e.message));

    return res.json({ success: true, category });
  } catch (error) {
    console.error('Error in updateCategory:', error);
    return res.status(500).json({ error: error.message || 'Failed to update category.' });
  }
};

/**
 * Delete / Deactivate Category
 */
exports.deleteCategory = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;

    const category = await ItemCategory.findOne({ _id: id, organizationId: orgId });
    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    // Check if items are using it
    const itemsCount = await Item.countDocuments({ organizationId: orgId, categoryId: id });
    if (itemsCount > 0) {
      return res.status(400).json({
        error: `Cannot delete category: ${itemsCount} items are assigned to it. Deactivate instead.`,
      });
    }

    category.active = false;
    await category.save();

    await AuditLog.create({
      organizationId: orgId,
      actor: req.user._id,
      action: 'item_category_deactivated',
      entity: 'ItemCategory',
      entityId: category._id,
      metadata: { code: category.code },
    }).catch((e) => console.warn('AuditLog error:', e.message));

    return res.json({ success: true, message: 'Category deactivated successfully.' });
  } catch (error) {
    console.error('Error in deleteCategory:', error);
    return res.status(500).json({ error: 'Failed to delete category.' });
  }
};
