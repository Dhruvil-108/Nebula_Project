const ExpenseCategory = require('../models/ExpenseCategory');
const { scanReceiptVision } = require('../services/aiService');

/**
 * AI-assisted receipt scanner via aiService with honest fallback
 */
exports.scanReceipt = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const userId = req.user?._id;
    const { receiptUrl, receiptBase64, mimeType = 'image/jpeg', fileName = 'receipt.jpg' } = req.body;

    if (!receiptUrl && !receiptBase64) {
      return res.status(400).json({ error: 'Receipt image (URL or Base64) is required.' });
    }

    // Fetch active categories for smart categorization
    const categories = await ExpenseCategory.find({ organizationId: orgId, isActive: true })
      .select('name code')
      .lean();

    const categoryNames = categories.map((c) => c.name);

    // Call central AI service
    const aiResult = await scanReceiptVision({
      organizationId: orgId,
      userId,
      receiptBase64,
      mimeType,
      categoryNames,
    });

    const extracted = aiResult.extractedData;

    // Match suggested category with DB ObjectId
    if (extracted.suggestedCategory) {
      const matched = categories.find((c) =>
        c.name.toLowerCase() === extracted.suggestedCategory.toLowerCase()
      );
      extracted.suggestedCategoryId = matched?._id || (categories.length ? categories[0]._id : null);
      extracted.suggestedCategoryName = matched?.name || (categories.length ? categories[0].name : extracted.suggestedCategory);
    } else if (categories.length > 0) {
      extracted.suggestedCategoryId = categories[0]._id;
      extracted.suggestedCategoryName = categories[0].name;
    }

    return res.json({
      success: true,
      provider: aiResult.provider,
      model: aiResult.model,
      extractedData: extracted,
      receiptUrl: receiptUrl || '',
      fileName: fileName || 'receipt.jpg',
    });
  } catch (error) {
    console.error('Error scanning receipt:', error);
    return res.status(500).json({ error: 'Failed to scan receipt image.' });
  }
};

/**
 * Natural Language Expense Parser (X3)
 */
exports.parseTextExpense = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const userId = req.user?._id;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Expense description text is required.' });
    }

    const categories = await ExpenseCategory.find({ organizationId: orgId, isActive: true })
      .select('name code')
      .lean();

    const categoryNames = categories.map((c) => c.name);

    const { parseNaturalLanguageExpense } = require('../services/aiService');
    const result = await parseNaturalLanguageExpense({
      organizationId: orgId,
      userId,
      text: text.trim(),
      categoryNames,
    });

    const parsed = result.parsedData;
    if (parsed.suggestedCategory) {
      const matched = categories.find(
        (c) => c.name.toLowerCase() === parsed.suggestedCategory.toLowerCase()
      );
      parsed.suggestedCategoryId = matched?._id || (categories[0]?._id || null);
    } else if (categories.length > 0) {
      parsed.suggestedCategoryId = categories[0]._id;
    }

    return res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error parsing text expense:', error);
    return res.status(500).json({ error: 'Failed to parse natural language expense.' });
  }
};

/**
 * Check for duplicate receipt hash (X6)
 */
exports.checkReceiptDuplicate = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { receiptBase64, contentHash, excludeClaimId } = req.body;

    const { computeReceiptHash, checkDuplicateReceipt } = require('../services/receiptService');

    let hash = contentHash;
    if (!hash && receiptBase64) {
      hash = computeReceiptHash(receiptBase64);
    }

    if (!hash) {
      return res.status(400).json({ error: 'Receipt data or hash is required.' });
    }

    const result = await checkDuplicateReceipt({
      organizationId: orgId,
      contentHash: hash,
      excludeClaimId,
    });

    return res.json({ success: true, hash, ...result });
  } catch (error) {
    console.error('Error checking duplicate receipt:', error);
    return res.status(500).json({ error: 'Failed to check duplicate receipt.' });
  }
};

