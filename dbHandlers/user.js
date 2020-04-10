const { User } = require('../models/');
const { OrgRole } = require('../models/');

const sha256 = require('sha256');

const addUser = async (userDetail) => {
    const { permissions } = userDetail;

    let orgRole = OrgRole({
        organization: userDetail.organization,
        organizationOwner: userDetail.organizationOwner ? userDetail.organizationOwner : false,
        permissions
    });

    let newUser = User({
        firstname: userDetail.firstname ? userDetail.firstname : '',
        lastname: userDetail.lastname ? userDetail.lastname : '',
        email: userDetail.email ? userDetail.email : '',
        password: sha256(userDetail.password ? userDetail.password : ''),
        emailVerified: userDetail.isEmailVerified ? userDetail.isEmailVerified : false,
        inviteStatus: userDetail.inviteStatus ? userDetail.inviteStatus : 'accepted',
        organizationRoles: [orgRole]
    });

    const user = await newUser.save();
    return user;
}

const find = function (query) {
    return User.find(query);
}

const updateUser = async (userID, userDetail) => {
    let result = await User.updateOne({ email: userID }, userDetail);
    return result.ok === 1
}

const checkUser = async (email) => {
    const userFromDb = await User.findOne({ email: email });

    if (userFromDb !== null) {
        return userFromDb['email'] === email;
    }

    return false;
}

const getUserByEmail = async (email) => {
    return await User.findOne({ email: email }).populate('organizationRoles.organization');
}

const getAllUsers = async () => {
    return await User.find();
}

module.exports = {
    addUser,
    updateUser,
    checkUser,
    getUserByEmail,
    getAllUsers,
    find
};
