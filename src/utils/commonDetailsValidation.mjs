// Backend/src/utils/commonDetailsValidation.mjs


// Individual staff details validation
export const individualStaffValidation = {
    username: {
        isLength: {
            options: {
                min: 3
            },
            errorMessage: "usernameLength"
        },
        notEmpty: {
            errorMessage: "usernameEmpty"
        }
    }
};