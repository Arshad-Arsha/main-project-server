const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'employeeId is required'],
    },
    employeeName: { type: String, required: true },
    department:   { type: String, default: '' },
    type: {
      type: String,
      required: true,
      enum: ['Annual Leave','Sick Leave','Casual Leave','Maternity Leave','Paternity Leave','Emergency Leave'],
    },
    startDate: {
      type: String,
      required: [true, 'startDate is required'],
      validate: {
        validator: v => !isNaN(Date.parse(v)),
        message: 'startDate must be a valid date (YYYY-MM-DD)',
      },
    },
    endDate: {
      type: String,
      required: [true, 'endDate is required'],
      validate: {
        validator: function (v) {
          return !isNaN(Date.parse(v)) && new Date(v) >= new Date(this.startDate);
        },
        message: 'endDate must be on or after startDate',
      },
    },
    days:   { type: Number, min: 1 },
    reason: { type: String, required: [true, 'reason is required'], minlength: 5 },
    status: {
      type: String,
      enum: ['Pending','Approved','Rejected'],
      default: 'Pending',
    },
    reviewedBy: { type: String, default: null },
    reviewNote: { type: String, default: '' },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Auto-calculate days before save
leaveSchema.pre('save', async function () {
  if (this.startDate && this.endDate) {
    const diff = new Date(this.endDate) - new Date(this.startDate);
    this.days = Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1, 1);
  }
});

module.exports = mongoose.model('Leave', leaveSchema);
