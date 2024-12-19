import Models from "../db/models.mjs"; // Adjust the path as needed
import bcrypt from 'bcrypt';

const createSuperUser = async () => {
    try {
        // Check if a superuser (admin) already exists
        const existingSuperUser = await Models.Admin.findOne({ where: { username: 'superadmin' } });

        if (existingSuperUser) {
            // Update existing superuser
            const hashedPassword = await bcrypt.hash('Gan@25453', 10); // Secure password
            await existingSuperUser.update({
                email: '98dilshanup@gmail.com',
                pwd: hashedPassword,
                full_name: 'Dilshan Upasena',
                gender: "Male",
                profile_pic: "Default Pic"
            });
            console.log('Superuser updated successfully!');
        } else {
            // Create a new superuser
            const hashedPassword = await bcrypt.hash('Gan@25453', 10); // Secure password
            await Models.Admin.create({
                username: 'superadmin',
                email: '98dilshanup@gmail.com',
                pwd: hashedPassword,
                full_name: 'Dilshan Upasena',
                gender: "Male",
                profile_pic: "Default Pic"
            });
            console.log('Superuser created successfully!');
        }
    } catch (error) {
        console.error('Error creating/updating superuser:', error);
    }
};

createSuperUser();
