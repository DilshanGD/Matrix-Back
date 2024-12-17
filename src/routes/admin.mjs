// Backend/src/routes/admin.mjs

import { Router } from "express";
import { validationResult, matchedData, checkSchema } from "express-validator";
import { batchValidation, streamValidation, subjectValidation, classValidation, adminValidation, adminLoginValidation,
    adminUpdateValidation, adminPWDValidation, adminUsernameValidation, individualStaffValidation } from "../utils/adminDetailsValidation.mjs";
import { staffValidation } from "../utils/staffDetailsValidation.mjs";
import Models from "../db/models.mjs";
import jwt from 'jsonwebtoken';
import { isAdminAuth } from '../utils/adminMiddleware.mjs'; 
import { Op } from 'sequelize';
//import { isAuth } from "../utils/middleware.mjs";    // Authentication middleware

const router = Router();

// New batch registering api
router.post("/admin/batch-registration", isAdminAuth, checkSchema(batchValidation), async (req, res) => {
    const result = validationResult(req);

    if(!result.isEmpty()) {
        return res.status(400).send({errors: result.array()});   // Validation errors - Redirect to add new batch page
        // return res.redirect("/admin/add-batch");                  // redirect to add new batch page
    }
    const data = matchedData(req);          // grabing data posted from client side.
    
    const parseBatch = parseInt(data.batch_id);

    if(isNaN(parseBatch)) {
        return res.status(400).send("Bad request. Invalid batch");   // If batch is not numeric it gives parseBatch == NaN
        // return res.redirect("/admin/add-batch");                  // redirect to add new batch page
    }

    //const batch = await Batch.create({ batch_id: data.batch_id });
        //.then((batch) => res.status(201).send(batch))         // redirect(admin/add-new)
        //.catch((err) => res.status(400).send(err.message));   // redirect(admin/add-batch)

    try {
        const isExist = await Models.Batch.count({   // Find given batch is exists in Batches table
            where: {
              batch_id: data.batch_id
            }
          });
        if(isExist){                                                   // checks the batch is exists
            return res.status(409).send("Already Registered");         // if exists 
            // redirect(adming/add-batch)
        }

        const batch = await Models.Batch.create({ batch_id: data.batch_id }); // Add new batch to batches table
        res.status(201).send(batch); // redirect(admin/add-new)
    } catch (err) {
        res.status(400).send(err.message); // redirect(admin/add-batch)
    }
})

// New Stream registering api
router.post("/admin/stream-registration", isAdminAuth, checkSchema(streamValidation), async (req, res) => {
    const result = validationResult(req);

    if(!result.isEmpty()) {
        return res.status(400).send({errors: result.array()});   // Validation errors - Redirect to add new stream page
        // return res.redirect("/admin/add-stream");              // redirect to add new stream page
    }
    const data = matchedData(req);                               // grabing data posted from client side.

    const stream = data.stream_id;
    const title = data.title;

    try {
        const streamExist = await Models.Stream.count({          // Find given stream is exists in Streams table
            where: {
              stream_id: stream
            }
          });
        if(streamExist){                                         // checks the stream is exists
            return res.status(409).send("Already-Registered");   // if exists 
            // redirect(adming/add-stream)
        }

        const savedStream = await Models.Stream.create({ stream_id: stream, title: title }); // Add new stream to streams table
        res.status(201).send(savedStream); // redirect(admin/add-new)
    } catch (err) {
        res.status(400).send(err.message); // redirect(admin/add-stream)
    }
})

// New Subject registering api
router.post("/admin/sub-registration", isAdminAuth, checkSchema(subjectValidation), async (req, res) => {
    const result = validationResult(req);

    if(!result.isEmpty()) {
        return res.status(400).send({errors: result.array()});   // Validation errors - Redirect to add new subject page
        // return res.redirect("/admin/add-subject");            // redirect to add new subject page
    }
    const data = matchedData(req);                               // grabing data posted from client side.

    const sub = data.sub_id;
    const title = data.title;
    const streamArray = data.stream_id;

    try {
        const subExist = await Models.Subject.count({          // Find given subject is exists in Subjects table
            where: {
              sub_id: sub
            }
        });
        if(subExist){                                            // checks the subject is exists
            return res.status(409).send("Already-Registered");   // if exists 
            // redirect(admin/add-sub)
        }

        // Prepare data to insert
        const subStreams = streamArray.map(stream => ({
            sub_id: sub,
            stream_id: stream
        }));

        const savedSubject = await Models.Subject.create({ sub_id: sub, title: title }); // Add new stream to Subjects table
        const savedSubStream = await Models.Stream_Subject.bulkCreate(subStreams);       // Add data to Stream_Subject table
        res.status(201).send(savedSubject); // redirect(admin/add-new)
    } catch (err) {
        res.status(400).send(err.message); // redirect(admin/add-sub)
    }
});

// New Class registering api
// router.post("/admin/class-registration", checkSchema(classValidation), async (req, res) => {
//     const result = validationResult(req);

//     if(!result.isEmpty()) {
//         return res.status(400).send({errors: result.array()});   // Validation errors - Redirect to add new-class page
//         // return res.redirect("/admin/add-class");              // redirect to add new-class page
//     }
//     const data = matchedData(req);                               // grabing data posted from client side.

//     const batchArray = data.batch_id;

//     try {
//         const classExist = await Models.Class.count({          // Find given class is exists in Class table
//             where: {
//               title: data.title
//             }
//         });
//         if(classExist){                                                // Checks the class is exists
//             return res.status(409).send("Already-Registered-Class");   // If exists 
//             // redirect(admin/add-class)
//         }

//         const savedClass = await Models.Class.create({ 
//             sub_id: data.sub_id, 
//             title: data.title,
//             batch_id: batchArray,
//             staff_id: data.staff_id,
//             type: data.type,
//             fee: data.fee,
//             location: data.location,
//             day: data.day,
//             time: data.time
//         }); // Add new class to Class table
        
//         res.status(201).send(savedClass); // redirect(admin/add-new)
//     } catch (err) {
//         res.status(400).send(err.message); // redirect(admin/add-class)
//     }
// });
router.post("/admin/class-registration", isAdminAuth, checkSchema(classValidation), async (req, res) => {
    const result = validationResult(req);

    if (!result.isEmpty()) {
        return res.status(400).send({ errors: result.array() });   // Validation errors
    }

    const data = matchedData(req);  // Grab the data posted from the client

    if (!validator.isDecimal(data.fee, { decimal_digits: '0,2' })) {   // Check if data.fee is a valid decimal
        return res.status(400).send("Fee must be numeric.");
        // redirect to add new class
    }
    
    const fee = parseFloat(data.fee)                       // Convert to float after validation

    try {
        // Check if the class already exists in the Classes table
        const classExist = await Models.Class.count({
            where: {
                title: data.title
            }
        });

        if (classExist) {
            return res.status(409).send("Class already exists");
        }

        // Check if the username exists in the Staffs table
        const staffExist = await Models.Staff.count({
            where: {
                username: data.username
            }
        });
        if (!staffExist) {
            return res.status(404).send("Staff username does not exist");
        }

        // Check if the sub_id exists in the Subjects table
        const subjectExist = await Models.Subject.count({
            where: {
                sub_id: data.sub_id
            }
        });
        if (!subjectExist) {
            return res.status(404).send("Subject ID does not exist");
        }

        // Check if the batches exist in the Batches table
        const batchExistPromises = data.batch_id.map(batchId => {
            return Models.Batch.count({
                where: {
                    batch_id: batchId.toString()
                }
            });
        });

        const batchExistResults = await Promise.all(batchExistPromises);

        // If any batch does not exist, return an error
        for (let i = 0; i < batchExistResults.length; i++) {
            if (batchExistResults[i] === 0) {
                return res.status(404).send(`Batch with ID ${data.batch_id[i]} does not exist`);
            }
        }

        // Create the new class record
        const savedClass = await Models.Class.create({
            sub_id: data.sub_id,
            title: data.title,
            username: data.username,
            type: data.type,
            fee: fee,
            location: data.location,
            day: data.day,
            startTime: data.startTime,
            endTime: data.endTime
        });

        // Create records in the ClassBatch table for the batches linked to the class
        const batchPromises = data.batch_id.map(async (batchId) => {
            await Models.ClassBatch.create({
                title: data.title,  // Same title as the class
                batch_id: batchId   // This is the ID of the batch related to the class
            });
        });

        await Promise.all(batchPromises);                // Wait for all the batch records to be created

        res.status(201).send(savedClass);
        // redirect to add new page
    } catch (err) {
        console.log(`Error is: ${err.message}`)
        res.status(400).send(err.message);
    }
});

// New Staff registration api
router.post("/admin/staff-registration", isAdminAuth, checkSchema(staffValidation), async (req, res) => {
    const result = validationResult(req);

    if(!result.isEmpty())
        return res.status(400).send({errors: result.array()});   // Validation errors
    
    const data = matchedData(req);          // grabing data posted from client side.

    try {
        const emailExist = await Models.Staff.count({  // Find given email is exists in staff table
            where: {
                email: data.email
            }
        });
        if(emailExist){
            return res.status(409).send("Already-Registered-email");
            // redirect to staff registration page
        }

        const usernameExist = await Models.Staff.count({   // Find given username is exists in staff table
            where: {
              username: data.username
            }
        });
        if(usernameExist){                                                   // checks the username is exists
            return res.status(403).send("Already-Registered-username");               // if not exists 
            // redirect to staff registration page
        }

        const subExist = await Models.Subject.count({  // Find given subject is exists in Subject table
            where: { 
                sub_id: data.sub_id 
            }
        });
        if(!subExist){                                                // Checks the subject is exists
            return res.status(403).send("Invalid-Subject");               // If not exists 
            // redirect to staff registration page
        }
          
        const savedStaff = await Models.Staff.create({       // Insert into Staff table
            username: data.username,
            full_name: data.full_name,
            email: data.email,
            sub_id: data.sub_id,
            gender: data.gender
        });

        // Send email to the staff member with username and generic pwd="1234"

        return res.status(201).send(savedStaff);
        // res.redirect("/admin/add-new"); // Forward to add-new page
    } catch(err) {
        console.log(`Error is: ${err.message}`);     // Mostly catch duplicate key error(Validation error of table)
        return res.sendStatus(400);      
        //return res.redirect("/admin/staff-registration");   // Forward to registration page again with the msg of already registered email
    }
});

// New Admin registration api
router.post("/admin/admin-registration", isAdminAuth, checkSchema(adminValidation), async (req, res) => {
    const result = validationResult(req);

    if(!result.isEmpty())
        return res.status(400).send({errors: result.array()});   // Validation errors
    
    const data = matchedData(req);          // grabing data posted from client side.

    try {
        const emailExist = await Models.Admin.count({  // Find given email is exists in admin table
            where: {
                email: data.email
            }
        });
        if(emailExist){
            return res.status(409).send("Already-Registered-email");
            // redirect to admin registration page
        }

        const usernameExist = await Models.Admin.count({   // Find given username is exists in admin table
            where: {
              username: data.username
            }
        });
        if(usernameExist){                                                   // checks the username is exists
            return res.status(403).send("Already-Registered-username");               // if not exists 
            // redirect to staff registration page
        }

          
        const savedAdmin = await Models.Admin.create({       // Insert into Admin table
            username: data.username,
            full_name: data.full_name,
            email: data.email,
            gender: data.gender
        });

        // Send email to new admin with username and generic pwd="1234"

        return res.status(201).send(savedAdmin);
        // res.redirect("/admin/add-new"); // Forward to add-new page
    } catch(err) {
        console.log(`Error is: ${err.message}`);     // Mostly catch duplicate key error(Validation error of table)
        return res.sendStatus(400);      
        //return res.redirect("/admin/admin-registration");   // Forward to registration page again with the msg of already registered email
    }
});

// Admin login api
router.post("/admin/admin-login", checkSchema(adminLoginValidation), async (req, res) => {
    const result = validationResult(req);

    if(!result.isEmpty())                                       // Checks for the validation errors
        return res.status(400).send({errors: result.array()});

    const data = matchedData(req);

    try {
        const findAdmin = await Models.Admin.findOne({ where: { email: data.email }});   // Search admin with the requested api
        
        if(!findAdmin)                             // Checks requested is found or not
            return res.status(404).send("Unregistered Admin");
            
        if(findAdmin.pwd !== data.pwd)             // Checks password for the login request
            return res.status(404).send("Invalid Password");

        const token = jwt.sign(
            {username: findAdmin.username, full_name: findAdmin.full_name, profile_pic: findAdmin.profile_pic, type: "admin" },
            process.env.JWT_SECRET,
            {expiresIn: "1h"}
        );

        return res.cookie("accessToken", token).status(200).json({ token });
        //return res.redirect("/admin/admin-dashboard");                     // Forward to student dashboard
    } catch(err) {
        return res.status(400).json({ message: err.message });
        //return res.redirect("/admin/admin-login");                     // Forward to same student login page with msg of error
    }
})

// Admin logout api
router.post("/admin/logout", async(req, res) => {
    res.clearCookie("accessToken",{
        secure: true,
        sameSite: "none"
    }).status(200).json({message: "Logged out Successfully."});
})

// Admin profile view api
router.post("/admin/admin-profile", isAdminAuth, async (req, res) => { 
    try {
      const admin = await Models.Admin.findOne({ 
        where: { username: req.user.username } 
      });
  
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found.' });
      }
  
      const responseData = { 
        username: admin.username, 
        full_name: admin.full_name, 
        email: admin.email, 
        gender: admin.gender, 
        profile_pic: admin.profile_pic 
    };
  
      res.status(200).json(responseData); 
    } catch (err) {
      console.error(err); 
      res.status(500).json({ message: 'Internal Server Error' }); 
    }
});

// Update admin details api
router.patch("/admin/admin-profile-update", isAdminAuth, checkSchema(adminUpdateValidation), async (req, res) => {
    const result = validationResult(req);

    if(!result.isEmpty())
        return res.status(400).send({errors: result.array()});   // Validation errors
    
    const data = matchedData(req);          // grabing data posted from client side.
    //console.log(data);

    try {
        if(data.email){
            const emailExist = await Models.Admin.count({ 
                where: { 
                    email: data.email, 
                    username: { [Op.ne]: req.user.username }  // Exclude current student's reg_no
                } 
            });
            if (emailExist > 0) {
                return res.status(409).send("Already-Registered-email");
            }
        }
         
        // Update student details
        const [affectedRows, savedAdmin] = await Models.Admin.update({
            full_name: data.full_name,
            email: data.email,
            gender: data.gender,
            profile_pic: data.profile_pic
        },{
            where: {
                username: req.user.username
            },
            returning: true  // This will returned the updated record
        });

        return res.status(201).send(savedAdmin);
        // redirect admin profile view page
    } catch(err) {
        console.log(`Error is: ${err.message}`);     // Mostly catch duplicate key error(Validation error of table)
        return res.status(500).send({error: err.message});      
        //return res.redirect("/student/student-profile-view"); 
    }
});

// Update admin password api
router.patch("/admin/new-password", isAdminAuth, checkSchema(adminPWDValidation), async (req, res) => {
    const result = validationResult(req);

    if(!result.isEmpty())
        return res.status(400).send({errors: result.array()});   // Validation errors
    
    const data = matchedData(req);          // grabing data posted from client side.

    try {
        // Update student details
        await Models.Admin.update({
            pwd: data.pwd
        },{
            where: {
                username: req.user.username
            },
            returning: true  // This will returned the updated record
        });
        
        return res.status(201).send("Password Updated Successfully.");
        // redirect admin profile view page
    } catch(err) {
        console.log(`Error is: ${err.message}`);     // Mostly catch duplicate key error(Validation error of table)
        return res.status(500).send({error: err.message});      
    }
});

// Update admin username api
router.patch("/admin/new-username", isAdminAuth, checkSchema(adminUsernameValidation), async (req, res) => {
    const result = validationResult(req);

    if(!result.isEmpty())
        return res.status(400).send({errors: result.array()});   // Validation errors
    
    const data = matchedData(req);          // grabing data posted from client side.

    try {
        if(data.username !== req.user.username){
            const usernameExist = await Models.Admin.count({ 
                where: { 
                    username: data.username 
                } 
            });
            console.log(usernameExist);
            if (usernameExist > 0) {
                return res.status(409).send("Already-Registered-username.");
            }
        }
        else {
            return res.status(201).send("Current username.");
        }

        await Models.Admin.update({
            username: data.username
        },{
            where: {
                username: req.user.username
            },
            returning: true  // This will returned the updated record
        });
        
        return res.status(201).send("Username Updated Successfully.");
        // redirect admin profile view page
    } catch(err) {
        console.log(`Error is: ${err.message}`);     // Mostly catch duplicate key error(Validation error of table)
        return res.status(500).send({error: err.message});      
    }
});

// Staff page api
router.get("/admin/staff", isAdminAuth, async (req, res) => { 
    try {
        const staffByStream = await Models.Staff.findAll({   // Find all staff with their respected streams
            include: [
                {
                    model: Models.Subject,
                    include: [
                        {
                            model: Models.Stream,
                            attributes: ['stream_id', 'title'],
                        }
                    ],
                    attributes: ['title'],
                }
            ],
            attributes: ['username', 'full_name', 'email', 'profile_pic'],
        });

        const staffGroups = staffByStream.reduce((acc, staff) => {    // Grouping the staff by streams and subjects
            const subject = staff.Subject; 
            const streams = subject?.Streams ?? [];

            streams.forEach((stream) => {
                const streamId = stream.stream_id; 
                const streamTitle = stream.title;

                if (!acc[streamId]) {                 // Initialize the stream group if it doesn't exist
                    acc[streamId] = {  
                        title: streamTitle,          // Store the title of the stream
                        subjects: {}                 // Prepare to group by subjects
                    };
                }

                if (!acc[streamId].subjects[subject.title]) {    // Initialize the subject group if it doesn't exist
                    acc[streamId].subjects[subject.title] = [];  // Initialize an array for the staff in this subject
                }

                acc[streamId].subjects[subject.title].push({    // Push the staff member's details to the corresponding subject group
                    username: staff.username,
                    full_name: staff.full_name,
                    email: staff.email,
                    profile_pic: staff.profile_pic
                });
            });
            return acc; // Return the accumulator for the next iteration
        }, {});
        
        return res.status(200).send({ staffGroups });
    } catch (err) {
        console.error("Error processing request:", err);
        return res.status(500).send({ error:err });
    }
});

// Individual staff page api
router.post("/admin/staff-individual", isAdminAuth, checkSchema(individualStaffValidation), async (req, res) => {
    const result = validationResult(req);
    
    if(!result.isEmpty())                                       // Checks for the validation errors
        return res.status(400).send({errors: result.array()});
    
    const data = matchedData(req);
    
    try {
        const username = data.username;

        const [staff, staffQualification, staffPhone, staffClass] = await Promise.all([
            Models.Staff.findOne({ where: { username } }),
            Models.Staff_Qualification.findAll({ where: { username } }),
            Models.Staff_Phone.findAll({ where: { username } }),
            Models.Class.findAll({ where: { username } })
        ]);

        const subTitle = await Models.Subject.findOne({
            where: { sub_id: staff.sub_id }
        });
        
        // Clean respone data
        const cleanStaffQualification = staffQualification.map(({ title, institute }) => ({
            title,
            institute
        }));

        const cleanStaffClass = staffClass.map(({ title, type, location, day, startTime, endTime, fee, batch_id }) => ({
            title,
            type,
            location,
            day,
            startTime,
            endTime,
            fee,
            batch_id
        }));

        const cleanStaffPhone= staffPhone.map(({ phone, phoneType }) => ({
            phone,
            phoneType
        }));
      
        const responseData = {
            full_name: staff.full_name,
            email: staff.email,
            profile_pic: staff.profile_pic,
            biography: staff.biography,
            subject: subTitle.title,
            phone: cleanStaffPhone,
            class: cleanStaffClass,
            staffQualification: cleanStaffQualification
        };
      
          res.status(200).json(responseData); 
        } catch (err) {
          console.error(err); 
          res.status(500).json({ message: 'Details not found.' }); 
        }

});

// Admin dashboard

// Student View                                  <-- Based on the stream, batch, class

// Change student status api

// Frontend details

// View subjects

// View streams

// View batch

// Update subjects

// Update streams

// Update batch

// Remove admin

// Remove staff

// Remove student

// Remove class










export default router;