const mongoose = require('mongoose');
const ProfilePhoto = require('../models/ProfilePhoto');
const { scopedFilter } = require('../middleware/tenant');

// Max stored size: ~1.5 MB base64 (fits comfortably in a 16MB BSON doc
// and keeps the /users/me/profile payload reasonable)
const MAX_BASE64_LENGTH = 2_000_000;
const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

/**
 * GET /api/v1/users/me/photo
 * Returns the caller's photo or `{ photoUrl: null }`.
 */
const getMyPhoto = async (req, res) => {
  try {
    const photo = await ProfilePhoto.findOne({ userId: req.user._id }).lean();
    return res.json({ photoUrl: photo?.dataUrl || null });
  } catch (err) {
    console.error('[profilePhoto.getMyPhoto] Error:', err);
    return res.status(500).json({ error: 'Failed to load profile photo.' });
  }
};

/**
 * POST /api/v1/users/me/photo  { image: dataUrl }
 * Validates the image and upserts — a re-upload atomically replaces the
 * user's existing photo, so each user (any role) has exactly one photo.
 */
const uploadMyPhoto = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Image data is required.' });
    }

    // Must be a data URL of an allowed image type
    const match = /^data:([a-zA-Z0-9/+.-]+);base64,/.exec(image);
    if (!match) {
      return res.status(400).json({ error: 'Image must be a base64 data URL.' });
    }
    if (!ALLOWED_MIME.includes(match[1].toLowerCase())) {
      return res.status(400).json({ error: 'Only PNG, JPEG, WebP, or GIF images are allowed.' });
    }
    if (image.length > MAX_BASE64_LENGTH) {
      return res.status(400).json({ error: 'Image is too large. Please upload an image under 1.5 MB.' });
    }

    const photo = await ProfilePhoto.findOneAndUpdate(
      { userId: req.user._id },
      {
        organizationId: req.organizationId,
        userId: req.user._id,
        dataUrl: image,
        uploadedBy: req.user._id,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({ message: 'Profile photo updated.', photoUrl: photo.dataUrl });
  } catch (err) {
    // Handle the (now impossible, but defended) duplicate-key race
    if (err.code === 11000) {
      const retry = await ProfilePhoto.findOneAndUpdate(
        { userId: req.user._id },
        {
          organizationId: req.organizationId,
          dataUrl: req.body.image,
          uploadedBy: req.user._id,
        },
        { new: true }
      );
      if (retry) {
        return res.status(201).json({ message: 'Profile photo updated.', photoUrl: retry.dataUrl });
      }
    }
    console.error('[profilePhoto.uploadMyPhoto] Error:', err);
    return res.status(500).json({ error: 'Failed to upload profile photo.' });
  }
};

/**
 * DELETE /api/v1/users/me/photo
 * Removes the caller's photo (avatar falls back to initials everywhere).
 */
const deleteMyPhoto = async (req, res) => {
  try {
    await ProfilePhoto.findOneAndDelete({ userId: req.user._id });
    return res.json({ message: 'Profile photo removed.' });
  } catch (err) {
    console.error('[profilePhoto.deleteMyPhoto] Error:', err);
    return res.status(500).json({ error: 'Failed to remove profile photo.' });
  }
};

module.exports = { getMyPhoto, uploadMyPhoto, deleteMyPhoto };
