const express = require('express');
const multer = require('multer');
const sharp = require('sharp');

const User = require('../models/user');
const auth = require('../middleware/auth');

const router = new express.Router();

router.post('/users/login', async (req, res) => {

    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();

        res.status(200).send({ user: user.getPublicProfile(), token });
    } catch (err) {
        res.status(400).send({ message: err });
    };
});

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
        await req.user.save();
        res.status(200).send({ message: 'User logged out successfully' });
    } catch (e) {
        res.status(500).send(e);
    }
});

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.status(200).send({ message: 'Users logged out successfully' });
    } catch (e) {
        res.status(500).send(e);
    }
});

// const upload = multer({
//     dest: 'avatars',
//     limits: {
//         fileSize: 1000000
//     },
//     fileFilter(req, file, cb) {
//         console.log(file);
//         if (!file.originalname.match(/\.(doc|docx)$/)) {    //regex101   // .endsWith('.pdf')
//             return cb(new Error('Upload a word doc'));
//         }
//         cb(undefined, true);
//     }
// });

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Kindly upload a picture'));
        }
        cb(undefined, true);
    }
});



router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send('Uploaded the file');
});

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send('Done');
});

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || !user.avatar) {
            throw new Error('No avatar found');
        }
        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    } catch (err) {
        res.status(404).send(err);
    }
});

router.post('/users', (req, res) => {
    const user = new User(req.body);
    user.save()
        .then(() => {
            const token = user.generateAuthToken();
            return token;
        }).then((token) => {
            res.status(201).send({ user: user.getPublicProfile(), token });
        }).catch(err => {
            res.status(400).send(err);
        });
});

router.get('/users/me', auth, (req, res) => {
    res.send(req.user.getPublicProfile());
});

router.patch('/users/me', auth, async (req, res) => {

    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const isValidOperation = updates.every((update) => {
        return allowedUpdates.includes(update);
    });
    if (!isValidOperation) {
        return res.status(400).send({ error: 'You have entered wrong field' });
    }

    try {
        // const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        updates.forEach(update => {
            req.user[update] = req.body[update];
        });
        await req.user.save();

        res.status(200).send(req.user.getPublicProfile());
    } catch (err) {
        res.status(500).send(err);
    }
});

router.delete('/users/me', auth, async (req, res) => {
    try {
        // const user = await User.findByIdAndDelete(req.user._id);
        // if (!user) {
        //     return res.status(404).send({ error: 'No user found' });
        // }
        await req.user.remove();
        res.status(200).send({ message: 'User Deleted', ...req.user.getPublicProfile() });
    } catch (err) {
        res.status(500).send(err);
    }
});

module.exports = router;
