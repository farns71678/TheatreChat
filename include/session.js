// session stuff
const maxSessionAge = 24 * 60 * 60;
// the admin has configuration access while the moderator does not
const authedUsers = [
    { id: 0, password: process.env.MODERATOR_PASS, role: "Moderator", loginPage: "moderator" },
    { id: 1, password: process.env.ADMIN_PASS, role: "Admin", loginPage: "config" }
];
const sessions = new Map();

module.exports = { sessions, authedUsers, maxSessionAge };