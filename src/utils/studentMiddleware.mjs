
import jwt from 'jsonwebtoken';

// export const isStudentAuth = (req, res, next) => {   // User authentication using session variable
//     if (req.session.isAuth) {
//         next();                               // Proceed if authenticated
//     } else {
//         res.redirect("/");                    // Redirect to home page if not authenticated
//     }
// };

// JWT token verification
export const isStudentAuth = (req, res, next) => {
    const token = req.cookies.accessToken;           

    if (!token) {
        return res.status(401).redirect('/');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if(decoded.type === "student")
        {
            req.user = decoded;                        // Store decoded token data in req.user for access in the request
            next();
        }
        else
        {
            return res.status(403).redirect('/');
        }
    } catch (error) {
        return res.status(403).redirect('/');
    }
};






