import Handwriting from '../models/Handwriting.js';

// @desc    Get all handwriting presets for user
// @route   GET /api/lab/presets
// @access  Private
export const getPresets = async (req, res) => {
  try {
    const presets = await Handwriting.find({ userId: req.user._id }).sort({ createdAt: -1 });
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

    const preset = await Handwriting.create({
      userId: req.user._id,
      name: name || 'New Script',
      config
    });

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
    const preset = await Handwriting.findOne({ _id: req.params.id, userId: req.user._id });

    if (!preset) {
      return res.status(404).json({ status: 'error', message: 'Preset not found.' });
    }

    if (name) preset.name = name;
    if (config) preset.config = { ...preset.config, ...config };
    if (isDefault !== undefined) {
      if (isDefault) {
        // Set all other presets to not default
        await Handwriting.updateMany({ userId: req.user._id }, { isDefault: false });
      }
      preset.isDefault = isDefault;
    }

    await preset.save();
    res.status(200).json({ status: 'success', preset });
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
    const preset = await Handwriting.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!preset) {
      return res.status(404).json({ status: 'error', message: 'Preset not found.' });
    }

    res.status(200).json({ status: 'success', message: 'Preset deleted.' });
  } catch (error) {
    console.error('Delete preset error:', error);
    res.status(500).json({ status: 'error', message: 'Could not delete handwriting preset.' });
  }
};
