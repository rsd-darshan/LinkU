import { ProfileOnboardingForm } from "@/components/profile/profile-onboarding-form";

export default function ProfilePage() {
  return (
    <section className="page-content route-shell route-profile" aria-labelledby="profile-title">
      <div className="page-header route-hero">
        <span className="route-badge">Identity settings</span>
        <h1 id="profile-title" className="page-title">Your profile</h1>
        <p className="page-description">
          Complete onboarding and keep your profile updated so others can find you. Mentor verification is automatic for .edu emails; otherwise it requires admin approval.
        </p>
      </div>
      <ProfileOnboardingForm />
    </section>
  );
}
