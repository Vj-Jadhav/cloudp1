import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      match: [
        /^[A-Za-z0-9-_]+$/,
        'Student ID must be alphanumeric and may contain hyphens or underscores',
      ],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Student name is required'],
      trim: true,
      minlength: [2, 'Student name must be at least 2 characters long'],
      maxlength: [100, 'Student name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Student email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address',
      ],
      index: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      minlength: [2, 'Department must be at least 2 characters long'],
      maxlength: [50, 'Department cannot exceed 50 characters'],
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: [1, 'Semester must be at least 1'],
      max: [12, 'Semester cannot exceed 12'],
      validate: {
        validator: Number.isInteger,
        message: 'Semester must be an integer between 1 and 12',
      },
    },
    contact: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: function (v) {
          // Contact is optional: if empty, valid. If provided, validate phone format.
          if (!v || v.trim() === '') return true;
          return /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/.test(v);
        },
        message: 'Please provide a valid contact number (7-15 digits)',
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Helpful compound text index or individual indexes for searching
studentSchema.index({ name: 'text', department: 'text' });

const Student = mongoose.model('Student', studentSchema);

export default Student;
