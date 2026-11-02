import fs from 'node:fs';
import admin from 'firebase-admin';

const email = process.argv[2]?.trim();
const password = process.argv[3]?.trim() || process.env.ADMIN_PASSWORD;
const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!email) {
  console.error('Usage: GOOGLE_APPLICATION_CREDENTIALS=/path/service-account.json node set-admin-claim.js admin@example.com ["optional-password"]');
  process.exit(1);
}

if (password && password.length < 6) {
  console.error('Password Firebase Auth minimal 6 karakter.');
  process.exit(1);
}

if (!credentialPath || !fs.existsSync(credentialPath)) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to an existing Firebase service-account JSON file.');
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(fs.readFileSync(credentialPath, 'utf8'));
} catch {
  console.error(`Credential file cannot be read as JSON: ${credentialPath}`);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

try {
  let user;
  try {
    user = await admin.auth().getUserByEmail(email);
    if (password) {
      user = await admin.auth().updateUser(user.uid, { password });
      console.log(`Updated password for Firebase user: ${email}`);
    }
  } catch (error) {
    if (error?.code !== 'auth/user-not-found') throw error;
    if (!password) {
      throw new Error('Akun belum ada. Berikan password awal saat menjalankan skrip ini.');
    }
    user = await admin.auth().createUser({ email, password, emailVerified: true });
    console.log(`Created Firebase user: ${email}`);
  }

  await admin.auth().setCustomUserClaims(user.uid, { admin: true });
  await admin.auth().revokeRefreshTokens(user.uid);
  console.log(`Admin claim set for ${email}. Sign in again to receive the refreshed token.`);
} catch (error) {
  console.error('Failed to configure admin account:', error instanceof Error ? error.message : error);
  process.exit(1);
}