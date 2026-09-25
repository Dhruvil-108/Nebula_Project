const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('./models/User');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nebula');
  const users = await User.find({ organizationId: '6a93d26c288d67183bc1dbb1' }).lean();
  console.log('Users in PVF Pvt Ltd.:', users.map(u => ({ id: u._id, name: u.fullName, email: u.email, role: u.role })));
  await mongoose.disconnect();
}

main();
