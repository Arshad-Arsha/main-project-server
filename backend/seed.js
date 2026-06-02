/**
 * seed.js — Populates MongoDB with sample users for development.
 * Run once: node seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('./schema/userSchema');

const SEED_USERS = [
  {
    name: 'Admin User', email: 'admin@careconnect.com', password: 'admin123',
    role: 'admin', department: 'Administration', phone: '+91 9876543210',
    joinDate: '2023-01-01', leaveBalance: { annual: 20, sick: 10, casual: 5 },
  },
  {
    name: 'John Smith', email: 'john@careconnect.com', password: 'john123',
    role: 'employee', department: 'IT', phone: '+91 9876543211',
    joinDate: '2024-03-15', leaveBalance: { annual: 15, sick: 8, casual: 3 },
  },
  {
    name: 'Sarah Johnson', email: 'sarah@careconnect.com', password: 'sarah123',
    role: 'employee', department: 'HR', phone: '+91 9876543212',
    joinDate: '2023-07-20', leaveBalance: { annual: 18, sick: 10, casual: 4 },
  },
  {
    name: 'Mike Chen', email: 'mike@careconnect.com', password: 'mike123',
    role: 'employee', department: 'Finance', phone: '+91 9876543213',
    joinDate: '2024-01-10', leaveBalance: { annual: 12, sick: 9, casual: 5 },
  },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO);
    console.log('✅  Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('🗑   Cleared existing users');

    // Hash passwords and insert
    for (const u of SEED_USERS) {
      u.password = await bcrypt.hash(u.password, 12);
      const user = new User(u);
      await user.save();
      console.log(`✔   Created: ${u.email} (${u.role})`);
    }

    console.log('\n🎉  Seed complete! Login credentials:');
    console.log('    Admin   → admin@careconnect.com  / admin123');
    console.log('    John    → john@careconnect.com   / john123');
    console.log('    Sarah   → sarah@careconnect.com  / sarah123');
    console.log('    Mike    → mike@careconnect.com   / mike123\n');
    process.exit(0);
  } catch (err) {
    console.error('❌  Seed failed:', err.message);
    process.exit(1);
  }
})();
