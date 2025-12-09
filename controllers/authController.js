const { sessions, authedUsers, maxSessionAge } = require('../include/session');
const uuid = require('uuid');

const login_get = (req, res) => {
    try {
        if (res.locals.session) {
            if (req.query.durl === 'moderator') {
                return res.redirect("/moderator");
            }
            else if (res.locals.session.user.role == "Admin") {
                return res.redirect("/config");
            }
        }
    }
    catch (error) {
        console.log(`Error in /login: ${error}`);
    }

    res.render('login');
};

const login_post = (req, res) => {
    try {
        const password = req.body.password;

        if (!password) {
            return res.status(403).json({ error: "Password required" });
        }

        for (let i = 0; i < authedUsers.length; i++) {
            if (authedUsers[i].password === password) {
                const sessionId = uuid.v4();
                sessions.set(sessionId, { user: authedUsers[i], timestamp: new Date().getTime() });
                // TODO: set secure: true for https only
                res.cookie("sessionId", sessionId, { httpOnly: true, maxAge: maxSessionAge * 1000 });
                res.json({ msg: "Login successful" });
                return;
            }
        }

        return res.status(403).json({ error: "Incorrect Password" });
    }
    catch (error) {
        console.log(`Error logging in: ${error}`);
        return res.status(500).json({ error: "Unable to login" });
    }
};

module.exports = { login_get, login_post };