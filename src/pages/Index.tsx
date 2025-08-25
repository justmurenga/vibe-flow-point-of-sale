import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Zap, Shield, Users, BarChart3, TrendingUp, Building2, Lock, Star, MousePointer, Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { LazyImage } from "@/components/ui/image-lazy";
import { TenantCreationModal } from "@/components/TenantCreationModal";
import ContactForm from "@/components/ContactForm";
import { Pricing } from "@/components/Pricing";
import Features from "@/components/Features";
import { DemoSection } from "@/components/DemoSection";
import Footer from "@/components/Footer";
import posSystemHero from "@/assets/pos-system-hero.jpg";
import dashboardPreview from "@/assets/dashboard-preview.jpg";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useMemo } from "react";
import { getCurrentDomain, isSubdomain, isCustomDomain } from "@/lib/domain-manager";
import { supabase } from "@/integrations/supabase/client";
import { UnifiedSignup } from "@/components/UnifiedSignup";

interface IndexProps {
  onSignupClick?: () => void;
}

export default function Index({ onSignupClick }: IndexProps) {
  const { user, loading, tenantId, userRole } = useAuth();
  const navigate = useNavigate();
  const [redirecting, setRedirecting] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const { isMainDevDomain, shouldRedirect, isApexShop, isApexOnline } = useMemo(() => {
    const domain = getCurrentDomain();
    const isMainDev = domain === "vibenet.online" || domain === "www.vibenet.online";
    const apexShop = domain === "vibenet.shop" || domain === "www.vibenet.shop";
    const apexOnline = false; // No apex online domains currently
    const redirect = !isMainDev && (isSubdomain(domain) || isCustomDomain(domain) || apexShop);
    return { isMainDevDomain: isMainDev, shouldRedirect: redirect, isApexShop: apexShop, isApexOnline: apexOnline };
  }, []);

  // Prevent infinite redirects by tracking if redirect has been attempted
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  useEffect(() => {
    // Only redirect once per user session
    if (!loading && user && !redirectAttempted) {
      setRedirectAttempted(true);
      
      const handleRedirect = async () => {
        // On apex domains, send authenticated users to their tenant's primary domain
        if (isApexShop || isApexOnline) {
          setRedirecting(true);
          console.info('LandingPage: apex redirect start', { domain: getCurrentDomain(), tenantId, userRole });
          try {
            // Superadmins should stay on apex and go to SuperAdmin
            if (userRole === 'superadmin') {
              console.info('LandingPage: superadmin on apex, routing to /superadmin');
              navigate('/superadmin');
              return;
            }

            if (!tenantId) {
              console.warn('LandingPage: missing tenantId, falling back to vibenet.online');
              window.location.href = "https://vibenet.online/admin";
              return;
            }
            // Try primary verified domain first
            const { data: primary, error: primaryError } = await supabase
              .from("tenant_domains")
              .select("domain_name")
              .eq("tenant_id", tenantId)
              .eq("is_active", true)
              .eq("is_primary", true)
              .eq("status", "verified")
              .maybeSingle();
            if (primaryError) console.warn('LandingPage: primary domain query error', primaryError);

            let targetDomain = primary?.domain_name as string | undefined;

            // If none, ensure a subdomain exists and use it
            if (!targetDomain) {
              const { data: ensuredId, error: ensureErr } = await supabase.rpc("ensure_tenant_subdomain", {
                tenant_id_param: tenantId,
              });
              if (ensureErr) console.warn('LandingPage: ensure subdomain error', ensureErr);
              if (ensuredId) {
                const { data: ensured } = await supabase
                  .from("tenant_domains")
                  .select("domain_name")
                  .eq("id", ensuredId)
                  .maybeSingle();
                targetDomain = ensured?.domain_name as string | undefined;
              }
            }

            if (targetDomain && getCurrentDomain() !== targetDomain) {
              console.info('LandingPage: redirecting to tenant domain', targetDomain);
              window.location.href = `https://${targetDomain}/admin`;
            } else {
              console.info('LandingPage: navigating to /dashboard on current domain');
              navigate("/admin");
            }
          } catch (e) {
            console.error('LandingPage: apex redirect failed, falling back', e);
                          window.location.href = "https://vibenet.online/admin";
          }
        } else if (shouldRedirect) {
          setRedirecting(true);
          console.info('LandingPage: internal redirect to /dashboard');
                        navigate('/admin');
        }
      };
      handleRedirect();
    }
  }, [user, loading]); // Reduced dependencies to prevent loops

  // Show landing page while loading
  if (loading) {
    return <Index />;
  }

  // Show signup modal if requested
  if (showSignup) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <UnifiedSignup 
          mode="trial"
          onSuccess={(result) => {
            setShowSignup(false);
            // Handle successful signup
            if (result.tenant) {
              navigate('/admin');
            }
          }}
          onError={(error) => {
            console.error('Signup error:', error);
            // Error handling is done within the component
          }}
        />
      </div>
    );
  }

  // Update the signup button to use the callback
  const handleSignupClick = () => {
    if (onSignupClick) {
      onSignupClick();
    } else {
      navigate('/signup');
    }
  };

  // Show main landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Fixed Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-b border-border z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <span className="text-xl font-bold">VibePOS</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {/* navigationItems.map((item) => ( */}
                <button
                  key="home"
                  onClick={() => navigate('/')}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Home
                </button>
                <button
                  key="features"
                  onClick={() => navigate('/#features')}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Features
                </button>
                <button
                  key="pricing"
                  onClick={() => navigate('/#pricing')}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Pricing
                </button>
                <button
                  key="demo"
                  onClick={() => navigate('/#demo')}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Demo
                </button>
                <button
                  key="security"
                  onClick={() => navigate('/#security')}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Security
                </button>
                <button
                  key="contact"
                  onClick={() => navigate('/#contact')}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Contact
                </button>
              {/* ))} */}
            </div>

            {/* CTA Button & Mobile Menu */}
            <div className="flex items-center space-x-4">
              <Button onClick={handleSignupClick} className="hidden sm:flex">
                Start Free Trial
              </Button>
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => navigate('/auth')}
                className="md:hidden p-2"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {/* isMobileMenuOpen && ( */}
            <div className="md:hidden py-4 border-t border-border">
              <div className="flex flex-col space-y-4">
                {/* navigationItems.map((item) => ( */}
                  <button
                    key="home"
                    onClick={() => navigate('/')}
                    className="text-left text-muted-foreground hover:text-primary transition-colors py-2"
                  >
                    Home
                  </button>
                  <button
                    key="features"
                    onClick={() => navigate('/#features')}
                    className="text-left text-muted-foreground hover:text-primary transition-colors py-2"
                  >
                    Features
                  </button>
                  <button
                    key="pricing"
                    onClick={() => navigate('/#pricing')}
                    className="text-left text-muted-foreground hover:text-primary transition-colors py-2"
                  >
                    Pricing
                  </button>
                  <button
                    key="demo"
                    onClick={() => navigate('/#demo')}
                    className="text-left text-muted-foreground hover:text-primary transition-colors py-2"
                  >
                    Demo
                  </button>
                  <button
                    key="security"
                    onClick={() => navigate('/#security')}
                    className="text-left text-muted-foreground hover:text-primary transition-colors py-2"
                  >
                    Security
                  </button>
                  <button
                    key="contact"
                    onClick={() => navigate('/#contact')}
                    className="text-left text-muted-foreground hover:text-primary transition-colors py-2"
                  >
                    Contact
                  </button>
                  <Button onClick={handleSignupClick} className="mt-4">
                    Start Free Trial
                  </Button>
                {/* ))} */}
              </div>
            </div>
          {/* )} */}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative overflow-hidden pt-32 pb-20 lg:py-40">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
        <div className="container relative mx-auto px-4">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
              <Badge variant="outline" className="text-sm px-4 py-2">
                <Zap className="h-4 w-4 mr-2" />
                Start your 14-day free trial today
              </Badge>
              <Badge variant="outline" className="text-sm px-4 py-2 border-green-500/50 bg-green-50 text-green-700">
                <Lock className="h-4 w-4 mr-2" />
                Wildcard SSL Secured
              </Badge>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              AI-Powered Modern POS with{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Smart Analytics
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Complete inventory management, stock reconciliation, and AI analytics. 
              Custom domains, own branded POS system for business growth.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="text-lg px-8 py-6" onClick={handleSignupClick}>
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={() => navigate('/#demo')}
              >
                View Demo
              </Button>
            </div>
            
          </div>

          {/* Hero Images */}
          <div className="mt-16 grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <div className="relative">
              <LazyImage 
                src={posSystemHero}
                alt="POS System Interface"
                className="w-full h-auto rounded-2xl shadow-[var(--shadow-elegant)] transform hover:scale-105 transition-transform duration-500"
                loading="eager"
              />
              <Badge className="absolute top-4 left-4 bg-white/90 text-black">
                Live POS System
              </Badge>
            </div>
            <div className="relative">
              <LazyImage 
                src={dashboardPreview}
                alt="Analytics Dashboard"
                className="w-full h-auto rounded-2xl shadow-[var(--shadow-elegant)] transform hover:scale-105 transition-transform duration-500"
                loading="eager"
              />
              <Badge className="absolute top-4 left-4 bg-white/90 text-black">
                AI Analytics Dashboard
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 border-t border-border/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">4.9/5</div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
              <div className="flex justify-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current text-yellow-400" />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">1000+</div>
              <div className="text-sm text-muted-foreground">Active Businesses</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features">
        <Features />
      </section>

      {/* Pricing Section */}
      <section id="pricing">
        <Pricing onStartTrial={handleSignupClick} />
      </section>

      {/* Demo Section */}
      <section id="demo">
        <DemoSection onStartTrial={handleSignupClick} />
      </section>

      {/* Security & Trust Section */}
      <section id="security" className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="outline" className="text-sm px-4 py-2">
              <Shield className="h-4 w-4 mr-2" />
              Enterprise Security
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold">
              Enterprise-Grade Security
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Your data is protected with bank-level security and industry-leading compliance standards.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>SSL Encryption</CardTitle>
                <CardDescription>256-bit SSL encryption for all data transmission</CardDescription>
              </CardHeader>
            </Card>
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Data Protection</CardTitle>
                <CardDescription>GDPR compliant with regular security audits</CardDescription>
              </CardHeader>
            </Card>
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Daily Backups</CardTitle>
                <CardDescription>Automated daily backups with instant recovery</CardDescription>
              </CardHeader>
            </Card>
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>99.9% Uptime</CardTitle>
                <CardDescription>Guaranteed uptime with 24/7 monitoring</CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Additional Security Features */}
          <div className="mt-16 bg-background/50 rounded-2xl p-8 backdrop-blur-sm border border-border/50">
            <h3 className="text-2xl font-bold text-center mb-8">Why Businesses Trust VibePOS</h3>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="space-y-3">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="font-semibold">ISO 27001 Certified</h4>
                <p className="text-sm text-muted-foreground">International security management standards</p>
              </div>
              <div className="space-y-3">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Lock className="h-8 w-8 text-blue-600" />
                </div>
                <h4 className="font-semibold">PCI DSS Compliant</h4>
                <p className="text-sm text-muted-foreground">Secure payment card data handling</p>
              </div>
              <div className="space-y-3">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <Building2 className="h-8 w-8 text-purple-600" />
                </div>
                <h4 className="font-semibold">SOC 2 Type II</h4>
                <p className="text-sm text-muted-foreground">Audited security controls and processes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-accent text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl opacity-90">
              Join thousands of businesses already using VibePOS to streamline operations 
              and boost sales. Start your free trial today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                variant="secondary" 
                className="text-lg px-8 py-6"
                onClick={handleSignupClick}
              >
                Start Your Free Trial Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-6 border-white/20 text-black hover:bg-white/10"
                onClick={() => navigate('/#contact')}
              >
                Get in Touch
              </Button>
            </div>
            <p className="text-sm opacity-75">
              No credit card required • Cancel anytime • 14-day free trial
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact">
        <ContactForm />
      </section>

      {/* Tenant Creation Modal */}
      <TenantCreationModal
        isOpen={false} // This modal is now handled by UnifiedSignup
        onClose={() => {}}
      />

      <Footer />
    </div>
  );
}