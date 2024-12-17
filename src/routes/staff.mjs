// Backend/src/routes/staff.mjs

import { Router } from "express";
import { validationResult, matchedData, checkSchema } from "express-validator";
import { staffUpdateValidation, staffLoginValidation, staffBiographyValidation, staffQualificationValidation, staffUsernameValidation, classValidation,
    staffQualificationUpdateValidation, tipsValidation, booksValidation, blogValidation, staffPWDValidation, classUpdateValidation,
    classTitleValidation, classRemoveValidation } from "../utils/staffDetailsValidation.mjs";
import Models from "../db/models.mjs";
import { bookId, extractBookId } from "../utils/utils.mjs";
import jwt from 'jsonwebtoken';
import { isStaffAuth } from '../utils/staffMiddleware.mjs'; 
import { Op } from 'sequelize';
import validator from 'validator';
//import { tipsValidation } from "../utils/adminDetailsValidation.mjs";
//import { isAuth } from "../utils/middleware.mjs";    // Authentication middleware

const router = Router();

// Staff login API
router.post("/staff/staff-login", checkSchema(staffLoginValidation), async (req, res) => {
    const result = validationResult(req);

    if(!result.isEmpty())                                       // Checks for the validation errors
        return res.status(400).send({errors: result.array()});

    const data = matchedData(req);

    try {
        const findStaff = await Models.Staff.findOne({ where: { email: data.email }});   // Search staff member with the requested api
        
        if(!findStaff)                             // Checks requested is found or not
            return res.status(404).send("Unregistered Staff Member");
            
        if(findStaff.pwd !== data.pwd)             // Checks password for the login request
            return res.status(404).send("Invalid Password");

        const token = jwt.sign(
            {username: findStaff.username, full_name: findStaff.full_name, profile_pic: findStaff.profile_pic, type: "staff" },
            process.env.JWT_SECRET,
            {expiresIn: "1h"}
        );

        return res.cookie("accessToken", token).status(200).json({ token });
        //return res.redirect("/staff/staff-dashboard");                     // Forward to student dashboard
    } catch(err) {
        return res.status(400).json({ message: err.message });
        //return res.redirect("/staff/staff-login");                     // Forward to same student login page with msg of error
    }
});

// Staff logout api
router.post("/staff/logout", async(req, res) => {
    res.clearCookie("accessToken",{
        secure: true,
        sameSite: "none"
    }).status(200).json({message: "Logged out Successfully."});
});

// Staff update API
router.patch("/staff/staff-profile-update", isStaffAuth, checkSchema(staffUpdateValidation), async (req, res) => {
    const result = validationResult(req);

    if(!result.isEmpty())
        return res.status(400).send({errors: result.array()});   // Validation errors
    
    const data = matchedData(req);          // grabing data posted from client side.

    try {
        if(data.email){
            const emailExist = await Models.Staff.count({ 
                where: { 
                    email: data.email, 
                    username: { [Op.ne]: req.user.username }  // Exclude current student's reg_no
                } 
            });
            if (emailExist > 0) {
                return res.status(409).send("Already-Registered-email");
            }
        }
        
        // Checks the subject is valid or not
        if(data.sub_id){
            const subExist = await Models.Subject.count({ where: { sub_id: data.sub_id }});
            if(!subExist){                          
                return res.status(404).send("Invalid-Subject");
                // res.redirect("/staff/staff-update");  // Forward to staff-update page
            }
        }

        // Updates staff profile
        const [affectedRows, [savedStaff]] = await Models.Staff.update({
            full_name: data.full_name,
            email: data.email,
            sub_id: data.sub_id,
            gender: data.gender,
            profile_pic: data.profile_pic
        },{
            where: {
                username: req.user.username
            },
            returning: true  // This will returned the updated record
        });

        // Update or Create home phone number
        if (data.phoneHome) {
            const [staffHome, createdHome] = await Models.Staff_Phone.findOrCreate({
                where: {
                    username: req.user.username,
                    phoneType: "H"
                },
                defaults: {
                    username: req.user.username,
                    phone: data.phoneHome,
                    phoneType: "H"
                }
            });
            if (!createdHome) {
                await Models.Staff_Phone.update({
                    phone: data.phoneHome
                }, {
                    where: {
                        username: req.user.username,
                        phoneType: "H"
                    }
                });
            }
        }

        // Update or Create mobile phone number
        if (data.phoneMobile) {
            const [staffMobile, createdMobile] = await Models.Staff_Phone.findOrCreate({
                where: {
                    username: req.user.username,
                    phoneType: "M"
                },
                defaults: {
                    username: req.user.username,
                    phone: data.phoneMobile,
                    phoneType: "M"
                }
            });
            if (!createdMobile) {
                await Models.Staff_Phone.update({
                    phone: data.phoneMobile
                }, {
                    where: {
                        username: req.user.username,
                        phoneType: "M"
                    }
                });
            }
        }

        // Update or Create home phone number
        // if(data.phoneHome){
        //     const [staffHome, [createdHome]] = await Models.Staff_Phone.findOrCreate({
        //         where: {
        //             username: req.user.username,
        //             phoneType: "H"
        //         },
        //         defaults: { 
        //             username: req.user.username, 
        //             phone: data.phoneHome,
        //             phoneType: "H" 
        //         }
        //     });
        //     if (!createdHome) {
        //         await Models.Staff_Phone.update({
        //             phone: data.phoneHome
        //         },{
        //             where: {
        //                 username: req.user.username,
        //                 phoneType: "H"
        //             }
        //         });
        //     }
        // }

        // Update or Create mobile phone number
        // if(data.phoneMobile){
        //     const [staffMobile, [createdMobile]] = await Models.Staff_Phone.findOrCreate({
        //         where: {
        //             username: req.user.username,
        //             phoneType: "M"
        //         },
        //         defaults: { 
        //             username: req.user.username, 
        //             phone: data.phoneMobile,
        //             phoneType: "M" 
        //         }
        //     });
        //     if (!createdMobile) {
        //         await Models.Staff_Phone.update({
        //             phone: data.phoneMobile
        //         },{
        //             where: {
        //                 username: req.user.username,
        //                 phoneType: "M"
        //             }
        //         });
        //     }
        // }

        return res.status(200).send(savedStaff);
        // res.redirect("/staff/staff-dashboard");  // Forward to staff home dashboard
    } catch(err) {
        console.log(`Error is: ${err.message}`);     // Mostly catch duplicate key error(Validation error of table)
        return res.status(400).send("Error updating profile");      
        //return res.redirect("/staff/staff-update");   // Forward to staff update page again with relevent error msg
    }
});

// Staff profile view API
router.get("/staff/staff-profile", isStaffAuth, async (req, res) => { 
    try {
        const findStaff = await Models.Staff.findOne({ where: { username: req.user.username }});  // Load relevent table
        return res.status(200).send(findStaff);
    } catch (err) {
        //console.log(err.message);
        return res.status(400).send(err.message);
    }
});

// Update staff password api
router.patch("/staff/new-password", isStaffAuth, checkSchema(staffPWDValidation), async (req, res) => {
    const result = validationResult(req);

    if(!result.isEmpty())
        return res.status(400).send({errors: result.array()});   // Validation errors
    
    const data = matchedData(req);          // grabing data posted from client side.

    try {
        // Update student details
        await Models.Staff.update({
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

// Update staff username api
router.patch("/staff/new-username", isStaffAuth, checkSchema(staffUsernameValidation), async (req, res) => {
    const result = validationResult(req);

    if(!result.isEmpty())
        return res.status(400).send({errors: result.array()});   // Validation errors
    
    const data = matchedData(req);          // grabing data posted from client side.

    try {
        if(data.username !== req.user.username){
            const usernameExist = await Models.Staff.count({ 
                where: { 
                    username: data.username 
                } 
            });
            if (usernameExist > 0) {
                return res.status(409).send("Already-Registered-username.");
            }
        }
        else {
            return res.status(201).send("Current username.");
        }

        await Models.Staff.update({
            username: data.username
        },{
            where: {
                username: req.user.username
            }
        });

        await Models.Staff_Phone.update({
            username: data.username
        },{
            where: {
                username: req.user.username
            }
        });

        await Models.Class.update({
            username: data.username
        },{
            where: {
                username: req.user.username
            }
        });

        await Models.Staff_Pay.update({
            staffUsername: data.username
        },{
            where: {
                staffUsername: req.user.username
            }
        });

        await Models.Staff_Qualification.update({
            username: data.username
        },{
            where: {
                username: req.user.username
            }
        });

        await Models.Blog.update({
            username: data.username
        },{
            where: {
                username: req.user.username
            }
        });

        await Models.Book.update({
            username: data.username
        },{
            where: {
                username: req.user.username
            }
        });

        await Models.Tip.update({
            username: data.username
        },{
            where: {
                username: req.user.username
            }
        });
        
        return res.status(201).send("Username Updated Successfully.");
        // redirect staff profile view page
    } catch(err) {
        console.log(`Error is: ${err.message}`);     // Mostly catch duplicate key error(Validation error of table)
        return res.status(500).send({error: err.message});      
    }
});

// Staff biography view API
router.get("/staff/biography-view", isStaffAuth, async (req, res) => {
    const username = req.user.username;

    try {
        const staffBio = await Models.Staff.findOne({
            where: { username },
            attributes: [ 'biography' ]
        });

        if (!staffBio) {
            return res.status(404).send("Staff member not found");
            // Redirect to staff biography edit page
        }

        return res.status(200).json(staff);
        // Redirect to staff biograpy edit page
    } catch (err) {
        console.error("Error is:", err);
        return res.status(500).send("Error fetching biography");
        // Redirect to staff profile view page
    }
});

// Staff update biography API
router.patch("/staff/biography-update", isStaffAuth, checkSchema(staffBiographyValidation), async (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json({ errors: result.array() });
    }

    const { biography } = matchedData(req);
    const username = req.user.username; 

    try {
        const [updatedRows, [updatedStaff]] = await Models.Staff.update(
            { biography },
            {
                where: { username },
                returning: true
            }
        );

        if (updatedRows === 0) {
            return res.status(404).send("Staff member not found"); // If staff member does not exist
        }

        return res.status(200).json(updatedStaff);
    } catch (err) {
        console.error("Error is:", err);
        return res.status(500).send("Error updating biography"); // Handle unexpected errors
    }
});

// Staff qualification add API
router.post('/staff/qualification-add', isStaffAuth, checkSchema(staffQualificationValidation), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });  // Return validation errors
    }

    const data = matchedData(req);          // grabing data posted from client side.
    const username = req.user.username;

    try {
        const existingQualification = await Models.Staff_Qualification.findOne({   // Check if the qualification already exists for this staff member
            where: { username, title: data.title }
        });
        if (existingQualification) {
            return res.status(409).json({ error: "Qualification already exists" });
            // Redirect to staff update page
        }

        const savedQualification = await Models.Staff_Qualification.create({  // Add new data to Staff_Qualification table
            username,
            title: data.title,
            type: data.type,
            ...(data.institute && { institute: data.institute })     // Conditionally include institute if provided
        });

        return res.status(201).json(savedQualification);
        // Redirect to staff update page
    } catch (error) {
        console.error("Error is:", error);
        return res.status(500).send("Error adding qualification");
        // Redirect to staff update page
    }
});

// Staff qualification update API
router.patch('/staff/qualification-update', isStaffAuth, checkSchema(staffQualificationUpdateValidation), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });  // Return validation errors
    }

    const data = matchedData(req); 
    const username = req.user.username;

    try {
        const qualification = await Models.Staff_Qualification.findOne({  // Check if the qualification exists with the current title
            where: { username, title: data.title } 
        });

        if (!qualification) {
            return res.status(404).json({ error: "Qualification not found" });
        }

        const updatedQualification = await qualification.update({
            type: data.type,  
            ...(data.institute && { institute: data.institute })  // Conditionally update institute if provided
        });

        return res.status(200).json(updatedQualification);
        // Redirect to staff update page with "Qualification Successfully Updated" msg
    } catch (err) {
        console.error("Error is:", err);
        return res.status(500).send("Error updating qualification");
        // Redirect to staff update page with "Error Updating Qualification" msg
    }
});

// Add new Tips(mini videos) 
router.post('/staff/add-tips', isStaffAuth, checkSchema(tipsValidation), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });  // Return validation errors
    }

    const data = matchedData(req);  // Grab data posted from client side.
    const username = req.user.username;  

    try {
        const subject = await Models.Subject.findOne({      // Check if the subject exists in the database
            where: { sub_id: data.sub_id }
        });
        if (!subject) {
            return res.status(404).json({ error: "Subject not found" });
        }

        const newTip = await Models.Tip.create({          // Create the new tip 
            title: data.title,
            sub_id: data.sub_id,
            source: data.source,
            username: username
        });

        return res.status(201).json(newTip); 

    } catch (error) {
        console.error("Error is:", error);
        return res.status(500).send({error : error});
    }
});

// Add new Books
router.post("/staff/add-books", isStaffAuth, checkSchema(booksValidation), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const data = matchedData(req); 
    const username = req.user.username;     

    try {
        const subject = await Models.Subject.findOne({     // Check if the subject exists
            where: { sub_id: data.sub_id },
        });
        if (!subject) {
            return res.status(404).json({ error: "Subject not found" });
        }

        const lastBook = await Models.Book.findOne({        // Get the last book's reg_no for the given sub_id
            where: { sub_id: data.sub_id },
            order: [['book_id', 'DESC']],                   // Ordering by reg_no in descending order
        });

        // Generate the new book_id using extractBookId
        let newBookId;
        if (lastBook && lastBook.book_id) {
            const lastBookNo = extractBookId(lastBook.book_id, data.sub_id);
            newBookId = bookId(data.sub_id, lastBookNo);
        } else {
            newBookId = bookId(data.sub_id, 0); // Generate a new book ID when no books exist for the subject
        }

        const newBook = await Models.Book.create({  // Create the new book entry
            book_id: newBookId,
            title: data.title,
            sub_id: data.sub_id,
            author: data.author,
            username: username,      
            image: data.image,
            source: data.source
        });

        return res.status(201).json(newBook); // Return the newly created book

    } catch (error) {
        console.error("Error is:", error);
        return res.status(500).json({ error: error });
    }
});

// Add new Blog
router.post("/staff/add-blogs", isStaffAuth, checkSchema(blogValidation), async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const data = matchedData(req); 
    const username = req.user.username;      

    try {
        const newBlog = await Models.Blog.create({  // Create the new blog
            title: data.title,
            username: username,        // After set login -> username: username  and remove username from validation
            image: data.image,
            content: data.content
        });

        return res.status(201).json(newBlog); // Return the newly created book

    } catch (error) {
        console.error("Error is:", error);
        return res.status(500).json({ error: error });
    }
});

// Add new Class
router.post("/staff/class-registration", isStaffAuth, checkSchema(classValidation), async (req, res) => {
    const result = validationResult(req);

    if (!result.isEmpty()) {
        return res.status(400).send({ errors: result.array() });   // Validation errors
    }

    const data = matchedData(req);  

    if (!validator.isDecimal(data.fee, { decimal_digits: '0,2' })) {   // Check if data.fee is a valid decimal
        return res.status(400).send("Fee must be numeric.");
        // redirect to add new class
    }

    const fee = parseFloat(data.fee)                       // Convert to float after validation

    try {
        const classExist = await Models.Class.count({      // Check if the class already exists in the Classes table
            where: {
                title: data.title
            }
        });
        if (classExist) {
            return res.status(409).send("Class already exists");
        }

        const subjectExist = await Models.Subject.count({    // Check if the sub_id exists in the Subjects table
            where: {
                sub_id: data.sub_id
            }
        });
        if (!subjectExist) {
            return res.status(404).send("Subject ID does not exist");
        }

        const batchExist = await Models.Batch.count({    // Check if the batch_id exists in the Batch table
            where: {
                batch_id: data.batch_id
            }
        });
        if (!batchExist) {
            return res.status(404).send("Batch ID does not exist");
        }

        // Create the new class record
        const savedClass = await Models.Class.create({
            sub_id: data.sub_id,
            title: data.title,
            username: req.user.username,
            type: data.type,                // Theory, Revision, Paper
            fee: fee,
            location: data.location,
            day: data.day,
            startTime: data.startTime,
            endTime: data.endTime,
            batch_id: data.batch_id
        });

        res.status(201).send(savedClass);
        // redirect to add new page
    } catch (err) {
        console.log(`Error is: ${err.message}`)
        res.status(400).send(err.message);
    }
});

// Add new Class page api & Update class page api
router.get("/staff/new-class-registration", async (req, res) => {    // Load subjects and Batches
    try {
        const findSubject = await Models.Subject.findAll({   // Load subjects
            attributes: ['sub_id', 'title']
        });  

        const findBatch = await Models.Batch.findAll({attributes: ['batch_id']});    // Load batches

        return res.status(200).send({
            subjects: findSubject,
            batches: findBatch
        });
    } catch (err) {
        //console.log(err.message);
        return res.status(400).send(err.message);
    }
});

// View own class api
router.get("/staff/class-view", isStaffAuth, async (req, res) => {
    const username = req.user.username;

    try {
        const staffClass = await Models.Class.findAll({
            where: { username }
        });
        if (!staffClass) {
            return res.status(404).send("Classes not found");
            // Redirect to staff dashboard page
        }

        const cleanStaffClass = staffClass.map(({ title, type, location, day, startTime, endTime, fee, batch_id, sub_id }) => ({
            title,
            type,
            location,
            day,
            startTime,
            endTime,
            fee,
            batch_id,
            sub_id
        }));
        return res.status(200).json(cleanStaffClass);
        // Redirect to staff myclass page
    } catch (err) {
        console.error("Error is:", err);
        return res.status(500).send("Error fetching biography");
        // Redirect to staff dashboard
    }
});

// Update class API
router.patch('/staff/class-update', isStaffAuth, checkSchema(classUpdateValidation), async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });  
    }

    const data = matchedData(req); 

    try {
        const updateClass = await Models.Class.findOne({  
            where: { title: data.title } 
        });
        if (!updateClass) {
            return res.status(404).json({ error: "Class not found" });
        }

        const updatedClass = await Models.Class.update({
            fee: data.fee,
            type: data.type,
            location: data.location,
            day: data.day,
            startTime: data.startTime,
            endTime: data.endTime,
            batch_id: data.batch_id,
            sub_id: data.sub_id
        },{
            where: {
                title: data.title
            },
            returning: true  // This will returned the updated record
        });

        return res.status(200).json(updatedClass);
        // Redirect to staff update page with "Class Successfully Updated" msg
    } catch (err) {
        console.error(err.message);
        return res.status(500).send("Error updating class");
        // Redirect to staff update page with "Error Updating Qualification" msg
    }
});

// Update class title api
router.patch("/staff/new-class-title", isStaffAuth, checkSchema(classTitleValidation), async (req, res) => {
    const result = validationResult(req);
    
    if(!result.isEmpty())
        return res.status(400).send({errors: result.array()});   // Validation errors
    
    const data = matchedData(req);   

    try {                                                  // oldTitle -> current title
        if(data.newTitle !== data.oldTitle){
            const titleExist = await Models.Class.count({ 
                where: { 
                    title: data.newTitle 
                } 
            });
            if (titleExist > 0) {
                return res.status(409).send("Already-Registered-title.");
            }
        }
        else {
            return res.status(201).send("Current Title.");
        }

        await Models.Class.update({
            title: data.newTitle
        },{
            where: {
                title: data.oldTitle
            }
        });

        await Models.Student_Class.update({
            title: data.newTitle
        },{
            where: {
                title: data.oldTitle
            }
        });

        await Models.Content.update({
            classTitle: data.newTitle
        },{
            where: {
                classTitle: data.oldTitle
            }
        });
        
        return res.status(201).send("Class title Updated Successfully.");
        // redirect staff own classes page
    } catch(err) {
        console.log(err.message);     // Mostly catch duplicate key error(Validation error of table)
        return res.status(500).send({error: err.message});      
    }
});

// Remove class
router.delete("/staff/remove-class", isStaffAuth, checkSchema(classRemoveValidation), async (req, res) => {
    const result = validationResult(req);

    if(!result.isEmpty())
        return res.status(400).send({errors: result.array()});   // Validation errors
    
    const data = matchedData(req);  

    try {
        const removeClass = await Models.Class.findOne({
            where: { title: data.title }
        });
        if (!removeClass) {
            return res.status(404).send("Classes not found");
            // Redirect to staff dashboard page
        }

        await Models.Student_Class.destroy({
            where: {
                title: data.title
            }
        });

        const contents = await Models.Content.findAll({
            where: { classTitle: data.title }
        });

        const contentIds = contents.map(content => content.content_id);

        const assignments = await Models.Content.findAll({
            where: { classTitle: data.title }
        });

        const assignmentIds = assignments.map(assignment => assignment.content_id);

        const topics = await Models.Content.findAll({
            where: { classTitle: data.title }
        });

        const topicIds = topics.map(topic => topic.content_id);

        await Models.Topic.destroy({
            where: { content_id: contentIds }
        });

        await Models.Assignment.destroy({
            where: { content_id: contentIds }
        });

        await Models.Topic_File.destroy({
            where: { topic_id: topicIds }
        });

        await Models.Answer.destroy({
            where: { ass_id: assignmentIds }
        });

        await Models.Content.destroy({
            where: {
                classTitle: data.title
            }
        });

        const removedClass = await Models.Class.destroy({
            where: { 
                title: data.title 
            },
            returning: true
        });

        return res.status(200).json(removedClass);
        // Redirect to staff myclass page
    } catch (err) {
        console.error("Error is:", err);
        return res.status(500).send({error: err.message});
        // Redirect to staff dashboard
    }
});

// Student top bar component api
router.post("/staff/staff-topbar", isStaffAuth, async (req, res) => {
    try {
        const findStaff = await Models.Staff.findOne({
            where: { username: req.user.username },
            attributes: ['full_name', 'username', 'profile_pic']
        });
        if (!findStaff) {
            return res.status(404).json({ message: "Staff member not found" });
        }

        const navLogo = await Models.Front_Detail.findOne({
            where: { type: 'nav' },
            attributes: ['file_path']
        });

        return res.status(200).json({
            full_name: findStaff.full_name,
            username: findStaff.username,
            profile_pic: findStaff.profile_pic,
            nav_logo: navLogo ? navLogo.file_path : 'default-logo.png'
        });
    } catch (err) {
        console.error("Error:", err.message);
        return res.status(500).json({ error: err.message });
    }
});

// View own class api
router.get("/staff/timetable", isStaffAuth, async (req, res) => {
    const username = req.user.username;

    try {
        const staffClass = await Models.Class.findAll({
            where: { username }
        });
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
        return res.status(500).send("Error fetching biography");
        // Redirect to staff dashboard
    }
});


// Remove account

// Remove qualification

// Student View                                  <-- Based on the stream, batch, class

// Staff dashboard

export default router;