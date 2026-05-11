import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | RIBMS",
  description: "This is Sign In Page RIBMS",
};

export default function SignIn() {
  return <SignInForm />;
}
