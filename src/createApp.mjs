// backend/src/createApp.mjs

import express from 'express';
//import mongoose from 'mongoose';
import routes from './routes/index.mjs';  // routes api's
import cookieParser from 'cookie-parser';
//import session from 'express-session';
//import MongoStore from 'connect-mongo';
import cors from 'cors';
import bodyParser from 'body-parser';
//import { DELETE } from 'sequelize/lib/query-types';

export function createApp() {
    const app = express();

    app.use(bodyParser.json({ limit: '10mb' })); // Increase the limit to your needs

    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Credentials", true);
        next()
    })

    app.use(cors({
          //origin: 'http://localhost:3000', // Allow requests from your frontend
          origin: 'https://matrix-online-institute-sl.netlify.app', // Allow requests from your frontend
          methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'], // Specify allowed methods
          //allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
          credentials: true, // Enable credentials (cookies, session)
        })
      );

    app.use(bodyParser.json());
    app.use(express.json());
    app.use(cookieParser());

    // Set up session handling
    // app.use(session({
    //     secret: "userID",
    //     resave: false,
    //     saveUninitialized: true,
    //     cookie: {
    //         secure: false,
    //         maxAge: 60000 * 60,       // cookie span = 1 hour
    //         httpOnly: true
    //     },
    //     store: MongoStore.create({
    //         client: mongoose.connection.getClient()
    //     }),
    // }));

    app.use(routes);  // Routes

    return app;
}
