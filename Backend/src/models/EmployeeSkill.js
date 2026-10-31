const mongoose = require('mongoose');

const certificationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    issuingOrg: { type: String, default: '' },
    issueDate: { type: Date, default: null },
    expiryDate: { type: Date, default: null },
    credentialId: { type: String, default: '' },
    verificationUrl: { type: String, default: '' },
  },
  { _id: true }
);

const employeeSkillSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
      index: true,
    },
    proficiencyLevel: {
      type: Number,
      min: 1,
      max: 5,
      default: 2, // 1=Beginner, 2=Intermediate, 3=Proficient, 4=Advanced, 5=Expert
    },
    yearsOfExperience: { type: Number, default: 1 },
    verifiedByManager: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: null },
    certifications: [certificationSchema],
  },
  { timestamps: true }
);

employeeSkillSchema.index({ organizationId: 1, employeeId: 1, skillId: 1 }, { unique: true });

module.exports = mongoose.model('EmployeeSkill', employeeSkillSchema);
