const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'employeeId is required'],
    },
    employeeName:       { type: String, required: true },
    counselorName:      { type: String, required: [true, 'counselorName is required'] },
    counselorSpecialty: { type: String, default: '' },
    date: {
      type: String,
      required: [true, 'date is required'],
      validate: {
        validator: v => !isNaN(Date.parse(v)),
        message: 'date must be a valid date (YYYY-MM-DD)',
      },
    },
    time: { type: String, required: [true, 'time is required'] },
    type: {
      type: String,
      required: true,
      enum: ['Mental Wellness','Nutrition Counseling','Fitness Assessment','Stress Management','General Wellness'],
    },
    mode: {
      type: String,
      required: true,
      enum: ['Video Call','In-Person','Phone Call'],
    },
    status: {
      type: String,
      enum: ['Pending','Confirmed','Completed','Cancelled'],
      default: 'Pending',
    },
    notes: { type: String, default: '' },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
