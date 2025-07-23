const express = require('express');
const router = express.Router();
const { processWorkflow } = require('../ai/workflowProcessor');
const { db } = require('../utils/db');
const auth = require('../middleware/auth');

// --- EXECUTION ENDPOINT (Existing) ---
router.post('/execute', auth, async (req, res) => {
  try {
    const { workflow } = req.body;
    const results = await processWorkflow(workflow);
    results.map(result => {if (result.api==='getTokenPricesByContracts' || result.api==='getNftMetadataByTokenIds') {
        console.log(result.data);
    }});
    res.json(results);
  } catch (error) {
    console.error('Workflow execution error:', error);
    res.status(500).json({
      error: 'Workflow execution failed',
      details: error.message
    });
  }
});

// --- CRUD ENDPOINTS (New) ---

// GET all workflows for the logged-in user
router.get('/', auth, async (req, res) => {
    try {
        const workflows = await new Promise((resolve, reject) => {
            db.all('SELECT * FROM workflows WHERE user_id = ? ORDER BY createdAt DESC', [req.user.id], (err, rows) => {
                if (err) return reject(err);
                // Parse the steps string back into a JSON object for each workflow
                const parsedRows = rows.map(row => ({
                    ...row,
                    steps: JSON.parse(row.steps || '[]')
                }));
                resolve(parsedRows);
            });
        });
        res.json(workflows);
    } catch (error) {
        console.error('Failed to fetch workflows:', error);
        res.status(500).json({ error: 'Failed to fetch workflows' });
    }
});

// POST a new workflow
router.post('/', auth, async (req, res) => {
    const { name, steps } = req.body;
    const userId = req.user.id;

    if (!name || !steps || !Array.isArray(steps)) {
        return res.status(400).json({ error: 'Missing required fields: name and steps array' });
    }

    try {
        const stepsJson = JSON.stringify(steps);
        const stmt = db.prepare('INSERT INTO workflows (name, steps, user_id) VALUES (?, ?, ?)');

        const info = await new Promise((resolve, reject) => {
            stmt.run(name, stepsJson, userId, function(err) {
                if (err) return reject(err);
                resolve(this);
            });
        });

        const newWorkflow = {
            id: info.lastID,
            name,
            steps,
            user_id: userId,
            createdAt: new Date().toISOString()
        };
        res.status(201).json(newWorkflow);
    } catch (error) {
        console.error('Failed to create workflow:', error);
        res.status(500).json({ error: 'Failed to create workflow' });
    }
});

// DELETE a workflow by ID
router.delete('/:id', auth, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const stmt = db.prepare('DELETE FROM workflows WHERE id = ? AND user_id = ?');

        const info = await new Promise((resolve, reject) => {
            stmt.run(id, userId, function(err) {
                if (err) return reject(err);
                resolve(this);
            });
        });

        if (info.changes === 0) {
            return res.status(404).json({ error: 'Workflow not found or you do not have permission to delete it.' });
        }

        res.status(204).send(); // Success with no content
    } catch (error) {
        console.error(`Failed to delete workflow ${id}:`, error);
        res.status(500).json({ error: 'Failed to delete workflow' });
    }
});

module.exports = router;