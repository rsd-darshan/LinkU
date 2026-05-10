import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return <p className="text-sm text-slate-600">Set Clerk keys in `.env.local` to enable authentication.</p>;
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4" aria-label="Sign up">
      <SignUp />
    </main>
  );
}
