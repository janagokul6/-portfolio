/**
 * Mongoose schema and model for MasterProfile
 * Stores a single global profile for the user.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import { MasterProfile, WorkExperience, Education } from '@/lib/types';

export interface IProfileDocument extends MasterProfile, Document {}

const WorkExperienceSchema = new Schema<WorkExperience>({
  company: { type: String, default: '' },
  title: { type: String, default: '' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  current: { type: Boolean, default: false },
  description: { type: String, default: '' },
});

const EducationSchema = new Schema<Education>({
  institution: { type: String, default: '' },
  degree: { type: String, default: '' },
  fieldOfStudy: { type: String, default: '' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
});

const ProfileSchema = new Schema<IProfileDocument>(
  {
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    pronouns: { type: String, default: '' },

    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zip: { type: String, default: '' },
    country: { type: String, default: '' },

    linkedinUrl: { type: String, default: '' },
    githubUrl: { type: String, default: '' },
    portfolioUrl: { type: String, default: '' },
    twitterUrl: { type: String, default: '' },

    willingToRelocate: { type: Boolean, default: false },
    sponsorshipRequired: { type: Boolean, default: false },
    authorizedToWork: { type: Boolean, default: false },
    desiredSalary: { type: String, default: '' },
    noticePeriod: { type: String, default: '' },
    howDidYouHear: { type: String, default: '' },
    securityClearance: { type: String, default: '' },

    gender: { type: String, default: '' },
    race: { type: String, default: '' },
    veteran: { type: String, default: '' },
    disability: { type: String, default: '' },

    resumeText: { type: String, default: '' },
    coverLetterText: { type: String, default: '' },
    customInstructions: { type: String, default: '' },

    workExperience: { type: [WorkExperienceSchema], default: [] },
    education: { type: [EducationSchema], default: [] },
    skills: { type: String, default: '' },
    languages: { type: String, default: '' },
  },
  { timestamps: true }
);

/**
 * Prevent model recompilation in Next.js hot-reload
 */
const ProfileModel: Model<IProfileDocument> =
  mongoose.models.Profile || mongoose.model<IProfileDocument>('Profile', ProfileSchema);

export default ProfileModel;
