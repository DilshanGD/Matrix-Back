
import jwt from 'jsonwebtoken';

// JWT token verification
export const isAdminAuth = (req, res, next) => {
    const token = req.cookies.accessToken;           

    if (!token) {
        return res.status(401).redirect('/');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if(decoded.type === "admin")
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






