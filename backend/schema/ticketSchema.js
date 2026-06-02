const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: { type: String, required: true },
  text:   { type: String, required: true },
  time:   { type: Date, default: Date.now },
});

const hrTicketSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'employeeId is required'],
    },
    employeeName: { type: String, required: true },
    department:   { type: String, default: '' },
    category: {
      type: String,
      required: true,
      enum: ['Payroll','IT Support','Benefits','Onboarding','Policy Clarification','Workplace Issue','Other'],
    },
    subject: {
      type: String,
      required: [true, 'subject is required'],
      minlength: [5, 'Subject must be at least 5 characters'],
    },
    description: {
      type: String,
      required: [true, 'description is required'],
      minlength: [10, 'Description must be at least 10 characters'],
    },
    priority: {
      type: String,
      enum: ['Low','Medium','High'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Open','In Progress','Resolved'],
      default: 'Open',
    },
    assignedTo: { type: String, default: null },
    comments:   { type: [commentSchema], default: [] },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

module.exports = mongoose.model('HRTicket', hrTicketSchema);
