const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
      type: String,
      enum: ['employee', 'admin'],
      default: 'employee',
    },
    department: {
      type: String,
      enum: ['IT', 'HR', 'Finance', 'Marketing', 'Operations', 'Administration'],
      default: 'IT',
    },
    avatar: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    joinDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
    leaveBalance: {
      annual: { type: Number, default: 20 },
      sick:   { type: Number, default: 10 },
      casual: { type: Number, default: 5  },
    },
    refreshToken: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Auto-generate avatar initials before saving
userSchema.pre('save', function () {
  if (this.isModified('name') || !this.avatar) {
    this.avatar = this.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
});

// Ensure virtual fields like 'id' are included in JSON/Object conversions
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Never return password or refreshToken in JSON responses
userSchema.methods.toSafeJSON = function () {
  const obj = this.toJSON(); // use toJSON to get virtual 'id'
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
