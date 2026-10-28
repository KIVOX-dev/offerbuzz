import { QrCard } from '@/components/account/QrCard';

export default function IntermediaryQr() {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-title font-bold">My QR code</h1>
        <p className="mt-1 text-muted">Show it to shop owners or share the link. It is unique to you.</p>
      </div>
      <QrCard
        title="Your referral QR code"
        blurb="A shop that scans this opens the vendor sign up with your code already filled in."
        target="vendor-signup"
      />
    </div>
  );
}
