const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error while fetching categories' });
  }
});

// @route   GET /api/categories/:id
// @desc    Get single category by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ category });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ message: 'Server error while fetching category' });
  }
});

// @route   POST /api/categories
// @desc    Create a new category
// @access  Private (Admin only)
router.post('/', auth, authorize('admin'), [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('color').optional().isHexColor().withMessage('Color must be a valid hex color'),
  body('icon').optional().isString().withMessage('Icon must be a string'),
  body('parentCategory').optional().isMongoId().withMessage('Parent category must be a valid ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, icon, color, parentCategory, sortOrder } = req.body;

    // Check if category with same name already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }

    // Validate parent category if provided
    if (parentCategory) {
      const parent = await Category.findById(parentCategory);
      if (!parent) {
        return res.status(400).json({ message: 'Parent category not found' });
      }
    }

    const category = new Category({
      name,
      description,
      icon,
      color,
      parentCategory,
      sortOrder: sortOrder || 0,
      isActive: true
    });

    await category.save();

    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Server error while creating category' });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update a category
// @access  Private (Admin only)
router.put('/:id', auth, authorize('admin'), [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('description').optional().trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('color').optional().isHexColor().withMessage('Color must be a valid hex color'),
  body('icon').optional().isString().withMessage('Icon must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if name is being changed and if it conflicts
    if (req.body.name && req.body.name !== category.name) {
      const existingCategory = await Category.findOne({ name: req.body.name });
      if (existingCategory) {
        return res.status(400).json({ message: 'Category with this name already exists' });
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Category updated successfully',
      category: updatedCategory
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Server error while updating category' });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete a category
// @access  Private (Admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if category has events
    const Event = require('../models/Event');
    const eventCount = await Event.countDocuments({ category: req.params.id });
    
    if (eventCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category. It has ${eventCount} associated events.` 
      });
    }

    // Check if category has subcategories
    const subcategoryCount = await Category.countDocuments({ parentCategory: req.params.id });
    if (subcategoryCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category. It has ${subcategoryCount} subcategories.` 
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Server error while deleting category' });
  }
});

// @route   PUT /api/categories/:id/toggle
// @desc    Toggle category active status
// @access  Private (Admin only)
router.put('/:id/toggle', auth, authorize('admin'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    category.isActive = !category.isActive;
    await category.save();

    res.json({
      message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
      category
    });
  } catch (error) {
    console.error('Toggle category error:', error);
    res.status(500).json({ message: 'Server error while toggling category' });
  }
});

module.exports = router;
