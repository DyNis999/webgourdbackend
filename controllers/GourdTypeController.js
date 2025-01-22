const GourdType = require('../models/gourdtype');

// Get all gourd types
exports.getAllGourdTypes = async (req, res) => {
    try {
        const gourdTypes = await GourdType.find();
        res.status(200).json(gourdTypes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get a gourd type by ID
exports.getGourdTypeById = async (req, res) => {
    try {
        const gourdType = await GourdType.findById(req.params.id);
        if (!gourdType) {
            return res.status(404).json({ message: 'Gourd type not found' });
        }
        res.status(200).json(gourdType);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Create a new gourd type
exports.createGourdType = async (req, res) => {
    const { name, description } = req.body;

    if (!name || !description) {
        return res.status(400).json({ message: 'Name and description are required.' });
    }

    try {
        const gourdType = new GourdType({ name, description });
        const newGourdType = await gourdType.save();
        res.status(201).json(newGourdType);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Update a gourd type by ID
exports.updateGourdType = async (req, res) => {
    const { name, description } = req.body;

    try {
        const gourdType = await GourdType.findById(req.params.id);
        if (!gourdType) {
            return res.status(404).json({ message: 'Gourd type not found' });
        }

        if (name) gourdType.name = name;
        if (description) gourdType.description = description;

        const updatedGourdType = await gourdType.save();
        res.status(200).json(updatedGourdType);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Delete a gourd type by ID
exports.deleteGourdType = async (req, res) => {
    try {
        const gourdType = await GourdType.findById(req.params.id);
        if (!gourdType) {
            return res.status(404).json({ message: 'Gourd type not found' });
        }

        await gourdType.deleteOne();
        res.status(200).json({ message: 'Gourd type deleted successfully.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
