import { ProfileForm } from '@/components/account/ProfileForm';

export default function IntermediaryProfile() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-title font-bold">Profile</h1>
      <p className="mb-4 mt-1 text-muted">Your contact details.</p>
      <ProfileForm />
    </div>
  );
}
