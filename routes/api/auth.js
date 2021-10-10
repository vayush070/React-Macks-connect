const express  = require('express');
const router = express.Router();
const auth = require('../../middleware/auth')
const User = require('../../models/user')
const {check, validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config')

router.get('/', auth, async (req,res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).json('Server Error');
    }
});

router.post('/', 
[
    check('email', 'Please include a valid Email')
    .isEmail(),
    check('password', 'Please is required')
    .exists()
],
async(req,res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {name,email,password} = req.body;

    try {
        let user  = await User.findOne({email});
        if(!user){
            // console.log("found error")
            return res.status(400).json({errors: [{ msg: 'Invalid Credentials'}]});
        }


        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch)
        {
            return res.status(400).json({errors: [{ msg: 'Invalid Credentials'}]});
        }

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            config.get('jwtSecret'),
            { expiresIn: 360000 },
            (error, token)=> {
                if(error) throw error;
                res.json({ token });
            }
        );


        




        // res.send('user registered'); 
    } catch (error) {
        console.error(error.message);
        res.status(500).send('server error');
    }
    
})


module.exports = router;