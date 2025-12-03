import React, { useState } from 'react';
import { FaRoute, FaFileUpload, FaCheckCircle, FaRocket, FaTruck, FaShieldAlt, FaClock, FaChartLine } from 'react-icons/fa';
import AuthModal from './AuthModal';

const LandingPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <FaTruck className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Oversize Route Builder</span>
            </div>
            <div className="flex items-center space-x-4">
              <a href="#features" className="text-gray-700 hover:text-primary-600 px-3 py-2">Features</a>
              <a href="#pricing" className="text-gray-700 hover:text-primary-600 px-3 py-2">Pricing</a>
              <button
                onClick={() => openAuth('login')}
                className="text-gray-700 hover:text-primary-600 px-3 py-2"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuth('register')}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-24 pb-16 bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold mb-6 leading-tight">
                Automated Route Building for Oversized Loads
              </h1>
              <p className="text-xl mb-8 text-primary-100">
                Upload your permit documents and instantly generate state-compliant routes. 
                Save hours of manual work and ensure perfect compliance with every trip.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => openAuth('register')}
                  className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition shadow-lg"
                >
                  Start Free Trial
                </button>
                <button
                  onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
                  className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-primary-600 transition"
                >
                  See How It Works
                </button>
              </div>
              <p className="mt-4 text-sm text-primary-200">
                ✓ No credit card required  ✓ Cancel anytime  ✓ Full support
              </p>
            </div>
            <div className="hidden md:block">
              <img 
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop" 
                alt="Oversize truck on highway"
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Trust Banner */}
      <div className="bg-white py-8 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center space-x-8 text-gray-500">
            <div className="flex items-center space-x-2">
              <FaCheckCircle className="text-green-500" />
              <span>Oklahoma DOT Compatible</span>
            </div>
            <div className="flex items-center space-x-2">
              <FaCheckCircle className="text-green-500" />
              <span>Texas DOT Compatible</span>
            </div>
            <div className="flex items-center space-x-2">
              <FaCheckCircle className="text-green-500" />
              <span>Multi-State Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div id="demo" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Three simple steps to automated, compliant routing
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-xl bg-gray-50 hover:shadow-lg transition">
              <div className="bg-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaFileUpload className="text-white text-2xl" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">1. Upload Permit</h3>
              <p className="text-gray-600">
                Simply upload your state-issued oversize/overweight permit PDF. 
                We support Oklahoma, Texas, and more states.
              </p>
            </div>

            <div className="text-center p-8 rounded-xl bg-gray-50 hover:shadow-lg transition">
              <div className="bg-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaRocket className="text-white text-2xl" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">2. Auto-Extract Data</h3>
              <p className="text-gray-600">
                Our AI instantly extracts route information, load specs, restrictions, 
                and all compliance requirements from your permit.
              </p>
            </div>

            <div className="text-center p-8 rounded-xl bg-gray-50 hover:shadow-lg transition">
              <div className="bg-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaRoute className="text-white text-2xl" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">3. Get Your Route</h3>
              <p className="text-gray-600">
                View your complete route with turn-by-turn directions, distance, 
                time estimates, and all restrictions clearly marked.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage oversized load routing
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition">
              <FaClock className="text-primary-600 text-3xl mb-4" />
              <h3 className="text-lg font-bold mb-2">Save Time</h3>
              <p className="text-gray-600 text-sm">
                Reduce route planning from hours to minutes with automated extraction
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition">
              <FaShieldAlt className="text-primary-600 text-3xl mb-4" />
              <h3 className="text-lg font-bold mb-2">Stay Compliant</h3>
              <p className="text-gray-600 text-sm">
                Never miss a restriction with automatic compliance checking
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition">
              <FaChartLine className="text-primary-600 text-3xl mb-4" />
              <h3 className="text-lg font-bold mb-2">Track Everything</h3>
              <p className="text-gray-600 text-sm">
                Organize all your permits and routes in one secure dashboard
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition">
              <FaTruck className="text-primary-600 text-3xl mb-4" />
              <h3 className="text-lg font-bold mb-2">Multi-Vehicle</h3>
              <p className="text-gray-600 text-sm">
                Manage multiple trucks and trailers with vehicle profiles
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that fits your business
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Basic Plan */}
            <div className="bg-gray-50 rounded-xl p-8 border-2 border-gray-200">
              <h3 className="text-2xl font-bold mb-4">Basic</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">$29</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                  <span>Up to 10 permits/month</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                  <span>Auto route extraction</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                  <span>Basic compliance</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                  <span>Email support</span>
                </li>
              </ul>
              <button
                onClick={() => openAuth('register')}
                className="w-full bg-gray-200 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Start Free Trial
              </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-primary-600 rounded-xl p-8 border-2 border-primary-700 transform scale-105 shadow-xl">
              <div className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
                MOST POPULAR
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Professional</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">$79</span>
                <span className="text-primary-200">/month</span>
              </div>
              <ul className="space-y-3 mb-8 text-white">
                <li className="flex items-start">
                  <FaCheckCircle className="text-green-300 mt-1 mr-2 flex-shrink-0" />
                  <span>Unlimited permits</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-green-300 mt-1 mr-2 flex-shrink-0" />
                  <span>Advanced route optimization</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-green-300 mt-1 mr-2 flex-shrink-0" />
                  <span>Multi-state compliance</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-green-300 mt-1 mr-2 flex-shrink-0" />
                  <span>Real-time notifications</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-green-300 mt-1 mr-2 flex-shrink-0" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-green-300 mt-1 mr-2 flex-shrink-0" />
                  <span>GPS export</span>
                </li>
              </ul>
              <button
                onClick={() => openAuth('register')}
                className="w-full bg-white text-primary-600 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                Start Free Trial
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-gray-50 rounded-xl p-8 border-2 border-gray-200">
              <h3 className="text-2xl font-bold mb-4">Enterprise</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">$199</span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                  <span>Everything in Pro</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                  <span>Multiple user accounts</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                  <span>API access</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                  <span>Custom integrations</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                  <span>Dedicated account manager</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                  <span>SLA guarantee</span>
                </li>
              </ul>
              <button
                onClick={() => openAuth('register')}
                className="w-full bg-gray-200 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Streamline Your Routing?</h2>
          <p className="text-xl mb-8 text-primary-100">
            Join hundreds of carriers already using automated route building
          </p>
          <button
            onClick={() => openAuth('register')}
            className="bg-white text-primary-600 px-12 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition shadow-lg"
          >
            Start Your Free Trial Today
          </button>
          <p className="mt-4 text-sm text-primary-200">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <FaTruck className="h-8 w-8 text-primary-400" />
                <span className="ml-2 text-lg font-bold">Oversize Route Builder</span>
              </div>
              <p className="text-gray-400 text-sm">
                Automated routing solutions for the oversize transport industry.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2025 Oversize Route Builder. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
          onSwitchMode={(mode) => setAuthMode(mode)}
        />
      )}
    </div>
  );
};

export default LandingPage;
