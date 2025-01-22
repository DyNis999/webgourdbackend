const Variety = require('../models/GourdVariety'); // Adjust the path as needed

// Get all varieties
exports.getAllVarieties = async (req, res) => {
    try {
        const varieties = await Variety.find().populate('gourdType', 'name description');
        res.status(200).json(varieties);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get a variety by ID
exports.getVarietyById = async (req, res) => {
    try {
        const variety = await Variety.findById(req.params.id).populate('gourdType', 'name description');
        if (!variety) {
            return res.status(404).json({ message: 'Variety not found' });
        }
        res.status(200).json(variety);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Create a new variety
exports.createVariety = async (req, res) => {
    const { name, gourdType, description } = req.body;

    if (!name || !gourdType || !description) {
        return res.status(400).json({ message: 'Name, gourd type, and description are required.' });
    }

    try {
        const variety = new Variety({ name, gourdType, description });
        const newVariety = await variety.save();
        res.status(201).json(newVariety);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Update a variety by ID
exports.updateVariety = async (req, res) => {
    const { name, gourdType, description } = req.body;

    try {
        const variety = await Variety.findById(req.params.id);
        if (!variety) {
            return res.status(404).json({ message: 'Variety not found' });
        }

        if (name) variety.name = name;
        if (gourdType) variety.gourdType = gourdType;
        if (description) variety.description = description;

        const updatedVariety = await variety.save();
        res.status(200).json(updatedVariety);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Delete a variety by ID
exports.deleteVariety = async (req, res) => {
    try {
        const variety = await Variety.findById(req.params.id);
        if (!variety) {
            return res.status(404).json({ message: 'Variety not found' });
        }

        await variety.deleteOne();
        res.status(200).json({ message: 'Variety deleted successfully.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
