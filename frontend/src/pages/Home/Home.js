import React from 'react';
import { Link } from 'react-router-dom';
import ApiHealthCheck from '../../components/Common/ApiHealthCheck';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
              Connect. Learn. Grow.
              <span className="block bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">Together in StudyHive</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 max-w-xl">
              Join focused study groups, share resources, ask questions, and collaborate in real time. Study smarter with the hive.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                to="/register"
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700"
              >
                Get Started Free
              </Link>
              <Link
                to="/study-groups"
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-primary-700 bg-white hover:bg-gray-50"
              >
                Explore Hives
              </Link>
            </div>

            {/* Features */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[{
                icon: '👥', title: 'AI-matched Groups', desc: 'Join study hives that match your goals and strengths.'
              }, {
                icon: '📚', title: 'Resource Sharing', desc: 'Upload notes, links and practice questions.'
              }, {
                icon: '💬', title: 'Real-time Chat', desc: 'Stay connected with your hive using live messaging.'
              }, {
                icon: '🏆', title: 'Gamification', desc: 'Earn points, badges and climb leaderboards.'
              }].map((f, i) => (
                <div key={i} className="bg-white/70 backdrop-blur shadow-sm rounded-xl p-5 border border-gray-100">
                  <div className="text-2xl">{f.icon}</div>
                  <h3 className="mt-2 font-semibold text-gray-900">{f.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Illustration */}
          <div className="hidden md:block">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary-200 to-secondary-200 rounded-3xl blur-2xl opacity-60"></div>
              <div className="relative bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
                <div className="grid grid-cols-3 gap-4">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-xl bg-gradient-to-br from-primary-50 to-secondary-50 border border-gray-100"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* API Health Check Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
            Backend Connection Status
          </h2>
          <ApiHealthCheck />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Ready to join the hive?</h2>
              <p className="mt-2 text-white/90">Create your account and start collaborating today.</p>
            </div>
            <Link
              to="/register"
              className="mt-4 md:mt-0 inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white text-primary-700 font-semibold hover:bg-gray-100"
            >
              Sign up free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

