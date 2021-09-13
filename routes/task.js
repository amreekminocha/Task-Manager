const express = require('express');

const Task = require('../models/task');
const auth = require('../middleware/auth');

const router = new express.Router();

router.post('/tasks', auth, (req, res) => {
    const task = new Task(req.body);
    task.owner = req.user._id;
    task.save().then(result => {
        res.status(201).send(result);
    }).catch(err => {
        res.status(400).send(err);
    });
});

router.get('/tasks/:id', auth, (req, res) => {
    const _id = req.params.id;
    Task.findOne({ _id, owner: req.user._id }).then((task) => {
        if (!task) {
            return res.status(404).send({ error: 'No task found' });
        }
        res.status(200).send(task);
    }).catch(err => {
        res.status(500).send(err);
    });
});

router.get('/tasks', auth, (req, res) => {

    const match = {};
    const sort = {};
    const limit = parseInt(req.query.limit);
    const skip = parseInt(req.query.skip);

    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':');
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    }

    req.user.populate({
        path: 'tasks',
        match,
        options: {
            limit,
            skip,
            sort
        }
    }).then((user) => {
        if (!user.tasks) {
            return res.status(404).send('No task found!');
        }
        res.status(200).send(user.tasks);
    }).catch(err => {
        res.status(500).send(err);
    });
});

router.patch('/tasks/:id', auth, async (req, res) => {

    const updates = Object.keys(req.body);
    const allowedUpdates = ['description', 'completed'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
    if (!isValidOperation) {
        return res.status(400).send({ error: 'You have entered wrong field' });
    }

    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });

        if (!task) {
            return res.status(404).send('No task found');
        }

        updates.forEach(update => {
            return task[update] = req.body[update];
        })
        await task.save();
        res.status(200).send(task);

    } catch (err) {
        res.status(500).send(err);
    }
});

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
        if (!task) {
            return res.status(404).send({ error: 'No task found' });
        }
        res.send(task);
    } catch (err) {
        res.status(500).send(err);
    }
});

module.exports = router;
