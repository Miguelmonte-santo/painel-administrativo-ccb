import type { Profile } from '../types';
import { Status } from '../types';

let mockProfiles: Profile[] = [];

const simulateDelay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getProfiles = async (status?: Status): Promise<Profile[]> => {
  await simulateDelay(500);
  if (status) {
    return mockProfiles.filter(p => p.status === status);
  }
  return mockProfiles;
};

export const updateProfileStatus = async (id: string, newStatus: Status, justification?: string): Promise<Profile> => {
  await simulateDelay(500);
  const profileIndex = mockProfiles.findIndex(p => p.id === id);
  if (profileIndex === -1) {
    throw new Error('Profile not found');
  }

  const updatedProfile = { ...mockProfiles[profileIndex], status: newStatus };
  
  if (newStatus === Status.Aprovado) {
    updatedProfile.ra = `2023${String(Math.floor(Math.random() * 900) + 100)}`;
    console.log(`Simulating: Welcome email sent to ${updatedProfile.email} with RA: ${updatedProfile.ra}`);
  }

  if (newStatus === Status.Rejeitado) {
     console.log(`Simulating: Rejection email sent to ${updatedProfile.email}. Justification: ${justification}`);
  }

  mockProfiles[profileIndex] = updatedProfile;
  return updatedProfile;
};