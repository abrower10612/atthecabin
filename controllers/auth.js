const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator');

const User = require('../models/user');
const { restart } = require('nodemon');

const updateProfile = require('../models/user');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_ACCOUNT, 
    pass: process.env.EMAIL_PWD
  }
});
 
exports.getLogin = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: message,
        userType: req.session.userType,
        currentUser: req.session.user,
        oldInput: {
            email: '',
            password: ''
        },
        validationErrors: [],
        isAuthenticated: req.session.isLoggedIn
    });
};

exports.getSignup = (req, res, next) => {
    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        errorMessage: "",
        currentUser: req.session.user,
        oldInput: {
            first: "",
            last: "", 
            email: "", 
            display: "",
            phone: "",
            password: "", 
            confirmPassword: "" 
        },
        validationErrors: [],
        isAuthenticated: req.session.isLoggedIn
    });
};

exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Reset Password',
        errorMessage: message,
        userType: req.session.userType,
        currentUser: req.session.user,
        isAuthenticated: req.session.isLoggedIn
    });
};

exports.getProfile = (req, res, next) => {
    res.render('auth/profile', {
        pageTitle: 'Profile',
        path: '/profile',
        user: req.session.user
    })
}
 
exports.getEditProfile = (req, res, next) => {
    let message = req.flash('notification');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    User.findById(req.session.user)
        .then(user => {
            res.render('auth/edit-profile', {
                path: '/edit-profile',
                pageTitle: 'Edit Profile',
                errorMessage: "",
                message: message,
                userType: req.session.userType,
                currentUser: user,
                oldInput: {
                    first: user.firstName,
                    last: user.lastName, 
                    email: user.email, 
                    password: "", 
                    confirmPassword: "" ,
                    image: user.image
                },
                validationErrors: [],
                isAuthenticated: req.session.isLoggedIn
            });
        })
};

exports.getUpdatePassword = (req, res, next) => {
    const userId = req.session.userId;
    User.findById(userId)
        .then(user => {
            let message = req.flash('notification');
            if (message.length > 0) {
                message = message[0];
            } else {
                message = null;
            }
            
            res.render('auth/update-password', {
                path: '/update-password',
                pageTitle: 'Update Password',
                errorMessage: "",
                message: message,
                userType: req.session.userType,
                currentUser: user,
                password: "",
                confirmPassword: "",
                userId: userId,
                isAuthenticated: req.session.isLoggedIn 
            });
        })
        .catch(err => {
            if(!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
        .then(user => {
            res.render('auth/new-password', {
                path: '/new-password',
                pageTitle: 'New Password',
                errorMessage: "",
                userType: req.session.userType,
                currentUser: req.session.user,
                userId: user._id.toString(), 
                passwordToken: token,
                isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => {
            if(!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: errors.array()[0].msg,
            userType: req.session.userType,
            currentUser: req.session.user,
            oldInput: {
                email: email,
                password: password
            },
            validationErrors: errors.array(),
            isAuthenticated: req.session.isLoggedIn
        });
    }
    User.findOne({email: email})
        .then(user => {
            if (!user) {
                return res.status(422).render('auth/login', {
                    path: '/login',
                    pageTitle: 'Login',
                    errorMessage: 'Invalid email or password',
                    userType: req.session.userType,
                    currentUser: req.session.user,
                    oldInput: {
                        email: email,
                        password: password
                    },
                    validationErrors: [],
                    isAuthenticated: req.session.isLoggedIn
                });
            }
            bcrypt.compare(password, user.password)
                .then(doMatch => {
                    const created = new Date().toISOString();
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.userType = user.userType;
                        req.session.user = user;
                        return req.session.save((err) => {
                            if(err) {
                                console.log(err);
                            }
                            res.redirect('/');
                        });
                    }
                    return res.status(422).render('auth/login', {
                        path: '/login',
                        pageTitle: 'Login',
                        errorMessage: 'Invalid email or password',
                        userType: req.session.userType,
                        currentUser: req.session.user,
                        oldInput: {
                            email: email,
                            password: password
                        },
                        validationErrors: [],
                        isAuthenticated: req.session.isLoggedIn
                    });
                })
                .catch(err => {
                    console.log(err);
                    res.redirect('/auth/login');
            })
            
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        if(err) {
            console.log(err);
        }
        res.redirect('/');
    });
};

exports.postSignup = (req, res, next) => {
    const first = req.body.first;
    const last = req.body.last;
    const display = req.body.display;
    const email = req.body.email;
    const phone = req.body.phone;
    const image = req.file;
    let imageUrl;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'Signup',
            errorMessage: errors.array()[0].msg,
            currentUser: req.session.user,
            oldInput: { 
                first: first,
                last: last,
                display: display,
                email: email, 
                phone: phone,
                password: password, 
                confirmPassword: confirmPassword 
            },
            validationErrors: errors.array(),
            isAuthenticated: req.session.isLoggedIn
        });
    }
    
    bcrypt
        .hash(password, 12)
        .then(hashedPassword => {
            if(!image) {
                imageUrl = '/images/avatar.jpg';
            } else {
                imageUrl = image.path.substring(6);
            }
            const user = new User({
                firstName: first,
                lastName: last,
                displayName: display,
                email: email,
                phone: phone,
                photo: imageUrl,
                password: hashedPassword,
                isAuthenticated: req.session.isLoggedIn
            });
            return user.save();
        })
        .then(result => {
            res.redirect('/auth/login');
            return transporter.sendMail({
                to: email,
                from: 'atTheCabin341@gmail.com',
                subject: '@theCabin Registration Successful',
                html: '<p>Dear ' + first + ',</p>' +
                    '<p>Thank your for registering with @theCabin!</p>' +
                    '<p>Sincerely,</p>' +
                    '<p> The @theCabin Staff</p>'
            });
        })  
        .catch(err => {
            if(!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.postReset = (req, res, next) => {
    const ROOTURL = process.env.HEROKU_ORIGIN || "http://localhost:5000";
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({email: req.body.email})
            .then(user => {
                if (!user) {
                    req.flash('error', 'No account found.');
                    return res.redirect('/auth/reset');
                } else {
                    user.resetToken = token;
                    user.resetTokenExpiration = Date.now() + 3600000; // expires in 1 hour
                    user.save();
                    res.redirect('/auth/login');
                    return transporter.sendMail({
                        to: req.body.email,
                        from: 'atTheCabin341@gmail.com',
                        subject: 'Password Reset',
                        html: `
                            <p>You requested a password reset</p>
                            <p>Click this <a href="${ROOTURL}auth/reset/${token}">link</a> to set a new password.</p>
                        `
                    });
                }  
            })
            .catch(err => {
                if(!err.statusCode) {
                    err.statusCode = 500;
                }
                next(err);
            });
    });
};

exports.postUpdateProfile = (req, res, next) => {
    const first = req.body.first;
    const last = req.body.last;
    const display = req.body.display;
    const email = req.body.email;
    const phone = req.body.phone;
    const image = req.file;
    const userId = req.body.userId;
    const imageUrl = "";
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('auth/edit-profile', {
            path: '/edit-profile',
            pageTitle: 'Edit Profile',
            errorMessage: errors.array()[0].msg,
            message: "",
            userType: req.session.user.userType,
            currentUser: req.session.user,
            oldInput: { 
                first: first,
                last: last,
                email: email, 
                display: display,
                phone: phone,
                password: "", 
                confirmPassword: "" ,
                image: imageUrl
            },
            validationErrors: errors.array(),
            isAuthenticated: req.session.isLoggedIn
        });
    }

    if(image) {
        imageUrl = image.path;
    }     

    User.findById(userId)
        .then(user => {
        user.firstName = first;
        user.lastName = last;
        user.displayName = display;
        user.email = email;
        user.phone = phone;
        if(imageUrl) user.photo = imageUrl.substring(6);
        console.log(user.photo);
        req.session.user = user;
        return user.save()
    })  
    .then(result => {
        // req.flash('notification', 'Profile Updated');
        res.redirect('../auth/edit-profile');
    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};

exports.postUpdatePassword = (req, res, next) => {
    const newPassword = req.body.password;
    const newConfirmPassword = req.body.confirmPassword;
    const userId = req.body.userId;
    let resetUser;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/update-password', {
            path: '/update-password',
            pageTitle: 'UpdatePassword',
            errorMessage: errors.array()[0].msg,
            message: "",
            userType: req.session.userType,
            currentUser: req.session.user,
            password: newPassword,
            confirmPassword: newConfirmPassword,
            userId: userId,
            validationErrors: errors.array(),
            isAuthenticated: req.session.isLoggedIn
        });
    }
    User.findById(req.session.user)
    .then(user => {
        resetUser = user;
        return bcrypt.hash(newPassword, 12);
    })
    .then(hashedPassword => {
        resetUser.password = hashedPassword;
        return resetUser.save();
    })  
    .then(result => {
        req.flash('notification', 'Password Updated');
        res.redirect('../auth/update-password');
    })
    .catch(err => {
        if(!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('auth/new-password', {
            path: '/new-password',
            pageTitle: 'New Password',
            errorMessage: errors.array()[0].msg,
            userType: req.session.userType,
            currentUser: req.session.user,
            userId: userId, 
            passwordToken: passwordToken,
            isAuthenticated: req.session.isLoggedIn
        });
    }
    User.findOne({
        resetToken: passwordToken, 
        resetTokenExpiration: {$gt: Date.now()}, 
        _id: userId
    })
    .then(user => {
        resetUser = user;
        return bcrypt.hash(newPassword, 12);
    })
    .then(hashedPassword => {
        resetUser.password = hashedPassword;
        resetUser.resetToken = undefined;
        resetUser.resetTokenExpiration = undefined;
        return resetUser.save();
    })  
    .then(result => {
        res.redirect('/auth/login');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};
