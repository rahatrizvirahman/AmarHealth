const {
  doctorNotification,
  patientNotification,
} = require("../models/notification");

let camelCase = function (str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
    return index == 0 ? word.toLowerCase() : word.toUpperCase();
  }).replace(/\s+/g, '');
}

let checkNotNull = (val) => {
  return typeof val != "undefined" && val != "" && val != null;
};

let calculateUnseenNotifications = async (userID, userRole) => {
  let totalUnseenNotifications = 0
  if(!checkNotNull(userID) || !checkNotNull(userRole)) return totalUnseenNotifications

  if (userRole == 'patient'){
    totalUnseenNotifications = await patientNotification.countDocuments({
      patientId: userID,
      seen: false,
    });
  }
  else if(userRole == 'doctor'){
    totalUnseenNotifications = await doctorNotification.countDocuments({
      doctorId: userID,
      seen: false,
    });
  }

  return totalUnseenNotifications
}

function preprocessData(obj){
  for (let key of Object.keys(obj)) {
    if (Array.isArray(obj[key])) {
      for (let i = 0, max = obj[key].length; i < max; i++) {
        if (checkNotNull(obj[key][i]))
          obj[key][i] = obj[key][i].trim();
      }
    } else {
      if (checkNotNull(obj[key])) obj[key] = obj[key].trim();
    }
  }
}

module.exports = 
{
  camelCase: camelCase,
  checkNotNull: checkNotNull,
  calculateUnseenNotifications: calculateUnseenNotifications,
  preprocessData: preprocessData
}