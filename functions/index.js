const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.setTeacherRoleOnAccountCreated = functions.firestore
  .document('teachers/{docId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const userId = after.userId; 
    const schoolId = after.schoolId;

    if (!before.accountCreated && after.accountCreated && userId) {
      try {
        await admin.auth().getUser(userId);
        await admin.auth().setCustomUserClaims(userId, { role: 'teacher', schoolId });
        console.log(`Set teacher role for user ${userId}`);
      } catch (error) {
        console.error(`Error: ${error}`);
      }
    }

    return null;
  });

exports.setStudentRoleOnAccountCreated = functions.firestore
  .document('students/{docId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const userId = after.userId;
    const schoolId = after.schoolId;
    const classId = after.classId;

    if (!before.accountCreated && after.accountCreated && userId) {
      try {
        await admin.auth().getUser(userId);
        await admin.auth().setCustomUserClaims(userId, { role: 'student', schoolId, classId });
        console.log(`Set student role, schoolId, and classId for user ${userId}`);
      } catch (error) {
        console.error(`Error: ${error}`);
      }
    }

    return null;
  });