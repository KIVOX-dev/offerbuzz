import { ProfileForm } from '@/components/account/ProfileForm';
import { QrCard } from '@/components/account/QrCard';

export default function MerchantProfile() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-title font-bold">Profile</h1>
        <p className="mt-1 text-muted">Build your profile: your details, shop name, category and shop location. You only do this once.</p>
      </div>
      <QrCard
        title="Your shop QR code"
        blurb="Print it for your counter or share the link. It is unique to your shop."
      />
      <ProfileForm showShop doneHref="/merchant/dashboard" />
    </div>
  );
}
