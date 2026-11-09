'use client';

import { ProfileForm } from '@/components/account/ProfileForm';
import { QrCard } from '@/components/account/QrCard';
import { useAccount } from '@/components/account/AccountShell';

export default function MerchantProfile() {
  const { user } = useAccount();
  const complete = Boolean(user.shopName && user.location && user.category);
  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <h1 className="text-title font-bold">{complete ? 'Profile' : 'Build your profile'}</h1>
        <p className="mt-1 text-muted">
          {complete
            ? 'Your details and your shop information.'
            : 'Add your shop details and shop location. You only do this once, then everything else unlocks.'}
        </p>
      </div>
      <ProfileForm showShop doneHref="/merchant/dashboard" />
      {/* the shop QR comes after the profile is done */}
      {complete && (
        <QrCard
          title="Your shop QR code"
          blurb="Print it for your counter or share the link. It is unique to your shop."
        />
      )}
    </div>
  );
}
