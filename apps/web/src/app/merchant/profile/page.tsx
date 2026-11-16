'use client';

import { ProfileForm } from '@/components/account/ProfileForm';
import { QrCard } from '@/components/account/QrCard';
import { useAccount } from '@/components/account/AccountShell';
import { useEffect, useState } from 'react';
import { getMySubscription } from '@/lib/api';

export default function MerchantProfile() {
  const { user } = useAccount();
  const complete = Boolean(user.shopName && user.location && user.category);
  // a merchant who has not paid goes on to choose a plan once the profile is done
  const [paid, setPaid] = useState<boolean>();
  useEffect(() => {
    getMySubscription().then((s) => setPaid(s.active)).catch(() => undefined);
  }, []);
  return (
    <div className="mx-auto max-w-6xl space-y-3">
      <div>
        <h1 className="text-section font-bold md:text-title">{complete ? 'Profile' : 'Build your profile'}</h1>
        <p className="text-small text-muted md:text-body">
          {complete
            ? 'Your details and your shop information.'
            : 'Add your shop details and shop location. You only do this once, then everything else unlocks.'}
        </p>
      </div>
      <ProfileForm showShop doneHref={paid ? '/merchant/dashboard' : '/merchant/subscription?from=profile'} />
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
