import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center">
      <div className="text-center mb-8 absolute top-12">
        <h1 className="text-2xl font-semibold">Ventus</h1>
      </div>
      <SignIn
        appearance={{
          variables: {
            colorBackground: "#0a0a0a",
            colorText: "#fafafa",
            colorPrimary: "#06b6d4",
            colorInputBackground: "#111111",
            colorInputText: "#fafafa",
          },
        }}
        fallbackRedirectUrl="/dashboard"
        
      />
    </div>
  );
}
