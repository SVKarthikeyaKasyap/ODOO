const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      minlength: [2, 'Name must be at least 2 characters'],
      trim: true,
      validate: {
        validator(value) {
          return !/^\d/.test(String(value || '').trim());
        },
        message: 'Name cannot start with a number',
      },
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator(value) {
          return !/^\d/.test(String(value || '').trim());
        },
        message: 'Email cannot start with a number',
      },
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'],
      required: [true, 'Please select a role'],
    },
    blocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userSchema.pre('save', async function preSave(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = function comparePassword(inputPassword) {
  return bcrypt.compare(inputPassword, this.password);
};

const UserModel = mongoose.model('users', userSchema);

module.exports = UserModel;
