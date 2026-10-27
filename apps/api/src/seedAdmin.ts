import { env } from './config/env';
import { connectDb, disconnectDb } from './config/db';
import { User } from './models/User';
import { getSettings } from './models/Setting';
import { generateReferralCode, hashPassword } from './modules/auth/auth.service';

async function main() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = env();
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (12+ characters) first');
  }
  await connectDb();
  await getSettings(); // creates the settings document with defaults
  const passwordHash = await hashPassword(ADMIN_PASSWORD);
  const email = ADMIN_EMAIL.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'admin';
    existing.status = 'active';
    existing.passwordHash = passwordHash;
    await existing.save();
    console.log(`Updated admin ${email}`);
  } else {
    await User.create({ email, name: 'Admin', role: 'admin', status: 'active', passwordHash, referralCode: generateReferralCode() });
    console.log(`Created admin ${email}`);
  }
  await disconnectDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
