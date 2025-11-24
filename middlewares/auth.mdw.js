export function isAuthenticated(req, res, next) {
    if (req.session.isAuthenticated) {
        next();
    } else {
        req.session.returnUrl = req.originalUrl;
        res.redirect('/account/signin');
    }
}
export function isAdmin(req, res, next) {
    if (req.session.authUser.permission === 1) {
        next();
    } else {
        res.render('403');
    }
}