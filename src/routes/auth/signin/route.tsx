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
      navigate('/');
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
        onClose={() => navigate('/')}
        initialMode="signin"
      />
    </div>
  );
}

export default SignInPage;