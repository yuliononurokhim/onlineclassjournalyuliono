import admin from 'firebase-admin';

const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!serviceAccount) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to the path of a Firebase service account JSON file.');
  process.exit(1);
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: node set-admin-claim.js admin@example.com');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

admin.auth().getUserByEmail(email)
  .then((user) => admin.auth().setCustomUserClaims(user.uid, { admin: true }))
  .then(() => {
    console.log(`Admin claim set for ${email}. Sign out and sign in again to refresh the token.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });