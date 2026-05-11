import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center">
      <SignUp
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
