import { prisma } from '../config/db.js';

// @desc    Get all handwriting presets for user
// @route   GET /api/lab/presets
// @access  Private
export const getPresets = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const presetsDB = await prisma.handwriting.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    
    // Map back to expected structure for frontend compatibility
    const presets = presetsDB.map(p => ({
      _id: p.id,
      name: p.name,
      isDefault: p.isDefault,
      config: {
        fontSize: p.fontSize,
        color: p.color,
        letterSpacing: p.letterSpacing,
        lineHeight: p.lineHeight,
        tilt: p.tilt,
        roughness: p.roughness,
        inkColor: p.inkColor,
        fontFamily: p.fontFamily
      },
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));

    res.status(200).json({ status: 'success', presets });
  } catch (error) {
    console.error('Get presets error:', error);
    res.status(500).json({ status: 'error', message: 'Could not fetch handwriting presets.' });
  }
};

// @desc    Create new handwriting preset
// @route   POST /api/lab/presets
// @access  Private
export const createPreset = async (req, res) => {
  try {
    const { name, config } = req.body;
    const userId = req.user.id || req.user._id;

    const presetDB = await prisma.handwriting.create({
      data: {
        userId,
        name: name || 'New Script',
        ...config // Spread config fields (fontSize, color, etc)
      }
    });

    const preset = {
      _id: presetDB.id,
      name: presetDB.name,
      isDefault: presetDB.isDefault,
      config: {
        fontSize: presetDB.fontSize,
        color: presetDB.color,
        letterSpacing: presetDB.letterSpacing,
        lineHeight: presetDB.lineHeight,
        tilt: presetDB.tilt,
        roughness: presetDB.roughness,
        inkColor: presetDB.inkColor,
        fontFamily: presetDB.fontFamily
      },
      createdAt: presetDB.createdAt,
      updatedAt: presetDB.updatedAt
    };

    res.status(201).json({ status: 'success', preset });
  } catch (error) {
    console.error('Create preset error:', error);
    res.status(500).json({ status: 'error', message: 'Could not save handwriting preset.' });
  }
};

// @desc    Update handwriting preset
// @route   PUT /api/lab/presets/:id
// @access  Private
export const updatePreset = async (req, res) => {
  try {
    const { name, config, isDefault } = req.body;
    const userId = req.user.id || req.user._id;
    
    const preset = await prisma.handwriting.findFirst({
      where: { id: req.params.id, userId }
    });

    if (!preset) {
      return res.status(404).json({ status: 'error', message: 'Preset not found.' });
    }

    if (isDefault) {
      // Set all other presets to not default
      await prisma.handwriting.updateMany({
        where: { userId },
        data: { isDefault: false }
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (config) {
      Object.assign(updateData, config);
    }
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    const updatedDB = await prisma.handwriting.update({
      where: { id: preset.id },
      data: updateData
    });

    const updatedPreset = {
      _id: updatedDB.id,
      name: updatedDB.name,
      isDefault: updatedDB.isDefault,
      config: {
        fontSize: updatedDB.fontSize,
        color: updatedDB.color,
        letterSpacing: updatedDB.letterSpacing,
        lineHeight: updatedDB.lineHeight,
        tilt: updatedDB.tilt,
        roughness: updatedDB.roughness,
        inkColor: updatedDB.inkColor,
        fontFamily: updatedDB.fontFamily
      },
      createdAt: updatedDB.createdAt,
      updatedAt: updatedDB.updatedAt
    };

    res.status(200).json({ status: 'success', preset: updatedPreset });
  } catch (error) {
    console.error('Update preset error:', error);
    res.status(500).json({ status: 'error', message: 'Could not update handwriting preset.' });
  }
};

// @desc    Delete handwriting preset
// @route   DELETE /api/lab/presets/:id
// @access  Private
export const deletePreset = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    // Prisma delete requires unique where, but we must verify userId
    // findFirst -> delete
    const preset = await prisma.handwriting.findFirst({
      where: { id: req.params.id, userId }
    });

    if (!preset) {
      return res.status(404).json({ status: 'error', message: 'Preset not found.' });
    }

    await prisma.handwriting.delete({ where: { id: preset.id } });

    res.status(200).json({ status: 'success', message: 'Preset deleted.' });
  } catch (error) {
    console.error('Delete preset error:', error);
    res.status(500).json({ status: 'error', message: 'Could not delete handwriting preset.' });
  }
};
