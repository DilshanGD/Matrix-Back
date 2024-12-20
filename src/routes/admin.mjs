// Backend/src/routes/admin.mjs

import { Router } from "express";
import { validationResult, matchedData, checkSchema } from "express-validator";
import { batchValidation, streamValidation, subjectValidation, classValidation, adminValidation, adminLoginValidation,
    adminUpdateValidation, adminPWDValidation, adminUsernameValidation, individualStaffValidation, removeSubjectValidation, staffRegistrationValidation,
    removeStaffValidation, streamRemoveValidation } from "../utils/adminDetailsValidation.mjs";
import Models from "../db/models.mjs";
import jwt from 'jsonwebtoken';
import { isAdminAuth } from '../utils/adminMiddleware.mjs'; 
import { Op } from 'sequelize';
import bcrypt from 'bcrypt';

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
    const stream = data.stream_id;

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
        // const subStreams = streamArray.map(stream => ({
        //     sub_id: sub,
        //     stream_id: stream
        // }));

        const savedSubject = await Models.Subject.create({ sub_id: sub, title: title }); // Add new stream to Subjects table
        //const savedSubStream = await Models.Stream_Subject.bulkCreate(subStreams);       // Add data to Stream_Subject table
        const savedSubStream = await Models.Stream_Subject.create({ sub_id: sub, stream_id: stream });       // Add data to Stream_Subject table
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
router.post("/admin/staff-registration", isAdminAuth, checkSchema(staffRegistrationValidation), async (req, res) => {
    const result = validationResult(req);

    const data = matchedData(req); 
    
    console.log(data);

    if(!result.isEmpty())
        return res.status(400).send({errors: result.array()});   // Validation errors
    
   // const data = matchedData(req);          // grabing data posted from client side.
    

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
            return res.status(409).send("Already-Registered-username");               // if not exists 
            // redirect to staff registration page
        }

        const subExist = await Models.Subject.count({  // Find given subject is exists in Subject table
            where: { 
                sub_id: data.sub_id 
            }
        });
        if(!subExist){                                                // Checks the subject is exists
            return res.status(409).send("Invalid-Subject");               // If not exists 
            // redirect to staff registration page
        }

        const hashedPassword = await bcrypt.hash("12345678", 10);
          
        const savedStaff = await Models.Staff.create({       // Insert into Staff table
            username: data.username,
            full_name: data.full_name,
            email: data.email,
            sub_id: data.sub_id,
            pwd: hashedPassword
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

// // Admin login api
// router.post("/admin/admin-login", checkSchema(adminLoginValidation), async (req, res) => {
//     const result = validationResult(req);

//     if(!result.isEmpty())                                       // Checks for the validation errors
//         return res.status(400).send({errors: result.array()});

//     const data = matchedData(req);

//     try {
//         const findAdmin = await Models.Admin.findOne({ where: { email: data.email }});   // Search admin with the requested api
        
//         if(!findAdmin)                             // Checks requested is found or not
//             return res.status(404).send("Unregistered Admin");
            
//         if(findAdmin.pwd !== data.pwd)             // Checks password for the login request
//             return res.status(404).send("Invalid Password");

//         const token = jwt.sign(
//             {username: findAdmin.username, full_name: findAdmin.full_name, profile_pic: findAdmin.profile_pic, type: "admin" },
//             process.env.JWT_SECRET,
//             {expiresIn: "1h"}
//         );

//         return res.cookie("accessToken", token, {
//             httpOnly: true,
//             secure: true,            // Ensure cookies are only sent over HTTPS
//             sameSite: 'none',        // Cross-origin cookie
//             maxAge: 60 * 60 * 1000, // 1 day
//           }).status(200).json({ token });
//         //return res.redirect("/admin/admin-dashboard");                     // Forward to student dashboard
//     } catch(err) {
//         return res.status(400).json({ message: err.message });
//         //return res.redirect("/admin/admin-login");                     // Forward to same student login page with msg of error
//     }
// })
// Admin login API
router.post("/admin/admin-login", checkSchema(adminLoginValidation), async (req, res) => {
    const result = validationResult(req);

    if(!result.isEmpty())                                       // Checks for the validation errors
        return res.status(400).send({errors: result.array()});

    const data = matchedData(req);

    try {
        const findAdmin = await Models.Admin.findOne({ where: { email: data.email }});   // Search admin with the requested API

        if(!findAdmin)                             // Checks if the requested admin is found or not
            return res.status(404).send("Unregistered Admin");

        // Compare hashed passwords
        const isPasswordValid = await bcrypt.compare(data.pwd, findAdmin.pwd);

        if(!isPasswordValid)                      // Checks password for the login request
            return res.status(404).send("Invalid Password");

        const token = jwt.sign(
            {username: findAdmin.username, full_name: findAdmin.full_name, profile_pic: findAdmin.profile_pic, type: "admin" },
            process.env.JWT_SECRET,
            {expiresIn: "1h"}
        );

        return res.cookie("accessToken", token, {
            httpOnly: true,
            secure: true,            // Ensure cookies are only sent over HTTPS
            sameSite: 'none',        // Cross-origin cookie
            maxAge: 60 * 60 * 1000, // 1 day
        }).status(200).json({ token });

    } catch(err) {
        return res.status(400).json({ message: err.message });
    }
});


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

// Student top bar component api
router.post("/admin/admin-topbar", isAdminAuth, async (req, res) => {
    try {
        const findAdmin = await Models.Admin.findOne({
            where: { username: req.user.username },
            attributes: ['full_name', 'username', 'profile_pic']
        });
        if (!findAdmin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        const navLogo = await Models.Front_Detail.findOne({
            where: { type: 'nav' },
            attributes: ['file_path']
        });

        return res.status(200).json({
            full_name: findAdmin.full_name,
            username: findAdmin.username,
            profile_pic: findAdmin.profile_pic,
            nav_logo: navLogo ? navLogo.file_path : 'default-logo.png'
        });
    } catch (err) {
        console.error("Error:", err.message);
        return res.status(500).json({ error: err.message });
    }
});

// View streams api
router.get("/admin/stream-view", isAdminAuth, async (req, res) => {
    try {
        const streams = await Models.Stream.findAll();
        if (!streams) {
            return res.status(404).send("Streams not found");
            // Redirect to staff dashboard page
        }

        return res.status(200).json(streams);
        // Redirect to streams page
    } catch (err) {
        console.error("Error is:", err);
        return res.status(500).send("Error fetching Streams");
        // Redirect to staff dashboard
    }
});

// Remove stream api
router.delete("/admin/stream-remove", isAdminAuth, checkSchema(streamRemoveValidation), async (req, res) => {
    const result = validationResult(req);
    
    if(!result.isEmpty())                                       // Checks for the validation errors
        return res.status(400).send({errors: result.array()});
    
    const data = matchedData(req);

    try {
        const stream = await Models.Stream.findOne({
            where : { stream_id : data.stream_id}
        });
        if (!stream) {
            return res.status(404).send("Streams not found");
            // Redirect to admin stream page
        }

        const sub = await Models.Stream_Subject.count({
            where: {
                stream_id: data.stream_id
            }
        });
        if (sub) {
            return res.status(404).send("Subjects are related to this stream. Cannot remove");
            // Redirect to admin stream page
        }

        await Models.Stream.destroy({
            where: {
                stream_id: data.stream_id
            }
        });

        return res.status(200).json(stream);
        // Redirect to streams page
    } catch (err) {
        console.error("Error is:", err);
        return res.status(500).send("Error removing stream");
        // Redirect to admin dashboard
    }
});

// View subjects api
router.get("/admin/subject-view", isAdminAuth, async (req, res) => {
    try {
        const subjects = await Models.Subject.findAll();
        if (!subjects) {
            return res.status(404).send("Subjects not found");
            // Redirect to staff dashboard page
        }

        return res.status(200).json(subjects);
        // Redirect to streams page
    } catch (err) {
        console.error("Error is:", err);
        return res.status(500).send("Error fetching Subjects");
        // Redirect to staff dashboard
    }
});

// View batch api
router.get("/admin/batch-view", isAdminAuth, async (req, res) => {
    try {
        const batches = await Models.Batch.findAll();
        if (!batches) {
            return res.status(404).send("Batches not found");
            // Redirect to staff dashboard page
        }

        return res.status(200).json(batches);
        // Redirect to streams page
    } catch (err) {
        console.error("Error is:", err);
        return res.status(500).send("Error fetching Batches");
        // Redirect to staff dashboard
    }
});

// Remove batch api
router.delete("/admin/batch-remove", isAdminAuth, checkSchema(batchValidation), async (req, res) => {
    const result = validationResult(req);
    
    if(!result.isEmpty())                                       // Checks for the validation errors
        return res.status(400).send({errors: result.array()});
    
    const data = matchedData(req);

    try {
        const batches = await Models.Batch.findOne({
            where : { batch_id : data.batch_id}
        });
        if (!batches) {
            return res.status(404).send("Batches not found");
            // Redirect to staff dashboard page
        }

        await Models.Batch.destroy({
            where: {
                batch_id: data.batch_id
            }
        });

        await Models.Class.destroy({
            where: {
                batch_id: data.batch_id
            }
        });

        return res.status(200).json(batches);
        // Redirect to streams page
    } catch (err) {
        console.error("Error is:", err);
        return res.status(500).send("Error fetching Batches");
        // Redirect to staff dashboard
    }
});

// router.delete("/admin/subject-remove", isAdminAuth, checkSchema(removeSubjectValidation), async (req, res) => {
//     const result = validationResult(req);
    
//     if(!result.isEmpty())                                       // Checks for the validation errors
//         return res.status(400).send({errors: result.array()});
    
//     const data = matchedData(req);

//     try {
//         const subject = await Models.Subject.findOne({
//             where : { sub_id : data.sub_id}
//         });
//         if (!subject) {
//             return res.status(404).send("Subject not found");
//             // Redirect to staff dashboard page
//         }

//         const classes = await Models.Class.findAll({
//             where: { sub_id: data.sub_id }
//         });

//         const subClass = classes.map(clz => clz.classTitle);

//         await Models.Class.destroy({
//             where: { classTitle: subClass }
//         });

//         const staffs = await Models.Staff.findAll({
//             where: { sub_id: data.sub_id }
//         });

//         const staff = staffs.map(stf => stf.username);

//         await Models.Staff.destroy({
//             where: { sub_id: data.sub_id }
//         });

//         await Models.Staff_Qualification.destroy({
//             where: {
//                 username: staff
//             }
//         });

//         await Models.Blog.destroy({
//             where: {
//                 username: staff
//             }
//         });

//         await Models.Book.destroy({
//             where: {
//                 username: staff
//             }
//         });

//         await Models.Tips.destroy({
//             where: {
//                 username: staff
//             }
//         });

//         await Models.Subject.destroy({
//             where: {
//                 sub_id: data.sub_id
//             }
//         });

//         return res.status(200).json(batches);
//         // Redirect to streams page
//     } catch (err) {
//         console.error("Error is:", err);
//         return res.status(500).send("Error Removing Subject");
//         // Redirect to staff dashboard
//     }
// });
// Remove subject api
router.delete("/admin/subject-remove", isAdminAuth, checkSchema(removeSubjectValidation), async (req, res) => {
    const result = validationResult(req);

    if (!result.isEmpty()) // Validation errors
        return res.status(400).send({ errors: result.array() });

    const data = matchedData(req);

    try {
        // Check if the subject exists
        const subject = await Models.Subject.findOne({
            where: { sub_id: data.sub_id },
        });

        if (!subject) {
            return res.status(404).send("Subject not found");
        }

        // Get all related classes
        const classes = await Models.Class.findAll({
            where: { sub_id: data.sub_id },
            attributes: ["title"],
        });
        const classTitles = classes.map((clz) => clz.title);

        // Delete all related classes
        if (classTitles.length > 0) {
            await Models.Class.destroy({
                where: { title: { [Op.in]: classTitles } },
            });
        }

        // Get all related staff
        const staffs = await Models.Staff.findAll({
            where: { sub_id: data.sub_id },
            attributes: ["username"],
        });
        const staffUsernames = staffs.map((stf) => stf.username);

        // Delete related staff records and their qualifications, blogs, books, and tips
        if (staffUsernames.length > 0) {
            await Models.Staff_Qualification.destroy({
                where: { username: { username: data.username } },
            });

            await Models.Blog.destroy({
                where: { username: { username: data.username } },
            });

            await Models.Book.destroy({
                where: { username: { username: data.username } },
            });

            await Models.Tip.destroy({
                where: { username: { username: data.username } },
            });

            await Models.Staff.destroy({
                where: { username: { username: data.username } },
            });
        }

        // Finally, delete the subject
        await Models.Subject.destroy({
            where: { sub_id: data.sub_id },
        });

        return res.status(200).send("Subject and related data removed successfully");
    } catch (err) {
        console.error("Error is:", err);
        return res.status(500).send("Error Removing Subject");
    }
});

// Remove staff api
router.delete("/admin/staff-remove", isAdminAuth, checkSchema(removeStaffValidation), async (req, res) => {
    const result = validationResult(req);
    
    if (!result.isEmpty()) // Validation errors
        return res.status(400).send({ errors: result.array() });

    const data = matchedData(req);
    console.log(data);
    try {
        // Check if the staff exists
        const staff = await Models.Staff.findOne({
            where: { username: data.username }, // Correct column name
        });
         
        if (!staff) {
            return res.status(405).send("Staff not found");
        }

        // Delete associated data for the staff
        await Models.Staff_Qualification.destroy({
            where: { username: data.username },
        });

        await Models.Blog.destroy({
            where: { username: data.username },
        });

        await Models.Book.destroy({
            where: { username: data.username },
        });

        await Models.Tip.destroy({
            where: { username: data.username },
        });

        await Models.Staff.destroy({
            where: { username: data.username },
        });

        return res.status(200).send("Staff member and related data removed successfully");

    } catch (err) {
        console.error("Error is:", err);
        return res.status(500).send("Error Removing Staff");
    }
});

// View timetable api
router.get("/admin/timetable", isAdminAuth, async (req, res) => {
    const username = req.user.username;

    try {
        const staffClass = await Models.Class.findAll();
        if (!staffClass) {
            return res.status(404).send("Classes not found");
            // Redirect to staff dashboard page
        }

        const cleanStaffClass = staffClass.map(({ title, type, day, startTime, endTime, batch_id }) => ({
            title,
            type,
            day,
            startTime,
            endTime,
            batch_id
        }));
        return res.status(200).json(cleanStaffClass);
        // Redirect to staff myclass page
    } catch (err) {
        console.error("Error is:", err);
        return res.status(500).send("Error fetching Timetable");
        // Redirect to staff dashboard
    }
});

// View streams  -> Delete button












export default router;