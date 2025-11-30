const { sessions, maxSessionAge } = require('../include/session');

const checkUser = (req, res, next) => {
    const sessionId = req.cookies.sessionId;

    if (sessionId) {
        const session = sessions.get(sessionId);
        if (session && new Date().getTime() < session.timestamp + maxSessionAge * 1000) {
            res.locals.session = session;
            next();
        }
        else {
            res.locals.session = null;
            if (session) sessions.delete(sessionId);
            next();
        }
    }
    else {
        res.locals.session = null;
        next();
    }
}

const requireAuth = (req, res, next) => {
    if (res.locals.session) {
        next();
    }
    else {
        res.redirect("/login?durl=moderator");
    }
};

const requireAdminAuth = (req, res, next) => {
    if (res.locals.session && res.locals.session.user.role === "Admin") {
        next();
    }
    else {
        res.redirect("/login?durl=config");
    }
};

module.exports = { checkUser, requireAuth, requireAdminAuth };