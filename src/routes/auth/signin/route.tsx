import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/components/auth/AuthContext";

function SignInPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      const redirectPath = sessionStorage.getItem('redirectPath');
      if (redirectPath) {
        sessionStorage.removeItem('redirectPath');
        navigate(redirectPath);
      } else {
        navigate('/');
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-default-background">
        <span className="text-body font-body text-subtext-color">Loading...</span>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-default-background">
      <AuthModal
        isOpen={true}
        onClose={() => {
          const redirectPath = sessionStorage.getItem('redirectPath');
          if (redirectPath) {
            sessionStorage.removeItem('redirectPath');
            navigate(redirectPath);
          } else {
            navigate('/');
          }
        }}
        initialMode="signin"
      />
    </div>
  );
}

export default SignInPage;