const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const {
    forgotpassHandler,
    postResetPass,
    postResetPassDoctor,
    emailVerificationLinkGenerator,
    checkEmailNotVerified,
    emailVerificationHandler,
    checkNotAuthenticated,
    checkAuthenticated,
    checkAuthenticatedDoctor,
} = require("../../controllers/auth_helper");
// Load User model
const User = require("../../models/userInfo");
const { session } = require("passport");

let checkNotNull = (val) => {
    return typeof val !== "undefined" && val !== "" && val !== null;
};

// resetpassword
router.get("/resetpassword", checkAuthenticated, (req, res) => {
    let navDisplayName = req.user.name.displayName;
    res.render("resetPass", { navDisplayName, role: "patient" });
});

router.post("/resetpassword", checkAuthenticated, postResetPass);


router.get(
    "/accountVerification",
    checkAuthenticated,
    checkEmailNotVerified,
    async (req, res) => {
        let navDisplayName = req.user.name.displayName;
        let fullName = req.user.name.firstName + " " + req.user.name.lastName;
        let userEmail = req.user.email;
        let role = "patient";
        res.render("accountVerification", {
            navDisplayName,
            fullName,
            userEmail,
            role,
        });
    }
);

router.post(
    "/accountVerification",
    checkAuthenticated,
    emailVerificationLinkGenerator
);

// this provides new id
router.get('/getNewId', (req, res) => {
    res.send({ id: new mongoose.Types.ObjectId() })
})

router.use("/profile", require("./profile.js"))

module.exports = router