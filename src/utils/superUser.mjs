
import Models from "../db/models.mjs"; // Adjust the path as needed
import bcrypt from 'bcrypt';


const createSuperUser = async () => {
    try {
        //const hashedPassword = await bcrypt.hash('Gan@25453', 10); // Replace with a secure password
        await Models.Admin.create({
            username: 'superadmin',
            email: '98dilshanup@gmail.com',
            pwd: 'Gan@25453',
            full_name: 'Dilshan Upasena',
            gender: "Male",
            profile_pic:"Default Pic"
        });
        console.log('Superuser created successfully!');
    } catch (error) {
        console.error('Error creating superuser:', error);
    }
};

createSuperUser();