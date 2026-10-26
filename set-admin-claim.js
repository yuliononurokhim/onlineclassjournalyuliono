import fs from 'node:fs';
import admin from 'firebase-admin';

const email = process.argv[2]?.trim();
const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!email) {
  console.error('Usage: GOOGLE_APPLICATION_CREDENTIALS=/path/service-account.json node set-admin-claim.js admin@example.com');
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
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, { admin: true });
  await admin.auth().revokeRefreshTokens(user.uid);
  console.log(`Admin claim set for ${email}. The user must sign in again to receive the refreshed token.`);
} catch (error) {
  console.error('Failed to set admin claim:', error instanceof Error ? error.message : error);
  process.exit(1);
}