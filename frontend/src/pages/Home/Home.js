import React from 'react';
import { Link } from 'react-router-dom';
// import ApiHealthCheck from '../../components/Common/ApiHealthCheck';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-gray-900 dark:text-gray-100">
              Study smarter with your hive
              <span className="block bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">AI‑powered groups, chat, and resources</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 max-w-xl">
              Join focused study hives, share notes and PDFs, chat in real time, and get AI tutoring tailored to your subjects. All in one modern workspace.
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
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-lg text-primary-700 dark:text-white bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Explore Hives
              </Link>
            </div>

            {/* Key Highlights */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[{
                icon: '🐝', title: 'AI‑matched hives', desc: 'We group you by subject, level and goals.'
              }, {
                icon: '📄', title: 'PDF uploads', desc: 'Share notes, past questions and resources securely.'
              }, {
                icon: '💬', title: 'Realtime chat', desc: 'Fast Socket.IO chat with typing indicators.'
              }, {
                icon: '🤖', title: 'AI Tutor', desc: 'Ask education‑only questions with smart guidance.'
              }].map((f, i) => (
                <div key={i} className="bg-white/70 dark:bg-gray-800/80 backdrop-blur shadow-sm rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                  <div className="text-2xl">{f.icon}</div>
                  <h3 className="mt-2 font-semibold text-gray-900 dark:text-gray-100">{f.title}</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* App-related Illustration: Honeycomb with icons */}
          <div className="hidden md:block">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary-200 to-secondary-200 rounded-3xl blur-2xl opacity-60"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                <svg viewBox="0 0 600 420" className="w-full h-auto">
                  <defs>
                    <linearGradient id="hc" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" />
                      <stop offset="100%" stopColor="#d946ef" />
                    </linearGradient>
                  </defs>
                  {Array.from({length:12}).map((_,i)=>{
                    const col=i%4; const row=Math.floor(i/4);
                    const x=80+col*120+(row%2?60:0); const y=60+row*90;
                    return (
                      <g key={i} transform={`translate(${x},${y})`}>
                        <polygon points="50,0 100,28 100,84 50,112 0,84 0,28" fill="#0f172a" stroke="url(#hc)" strokeWidth="2" />
                        <text x="50" y="65" textAnchor="middle" fontSize="28" fill="#e2e8f0">{['💬','📄','🐝','🤖','🔎','📚','🧠','⚡','🔔','🛡️','🏆','🧪'][i]}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">How StudyHive works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {step:'1',title:'Create your account',desc:'Sign up and set your subjects, level and goals.'},
              {step:'2',title:'Join a hive',desc:'Get matched to study groups or browse and join.'},
              {step:'3',title:'Share and chat',desc:'Upload PDFs and collaborate in real‑time chat.'},
              {step:'4',title:'Ask the AI tutor',desc:'Education‑only answers with step‑by‑step help.'}
            ].map((s,i)=> (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-100 dark:border-gray-700">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white flex items-center justify-center font-semibold">{s.step}</div>
                <h3 className="mt-3 font-semibold text-gray-900 dark:text-gray-100">{s.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid (comprehensive) */}
      <section className="py-4 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Everything you need to study together</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {title:'Organized study hives',desc:'Private/public groups, member roles, announcements.',icon:'📌'},
              {title:'Resource library',desc:'Upload PDFs and resources with previews and stats.',icon:'📁'},
              {title:'Realtime messaging',desc:'Socket.IO chat, typing indicators and message states.',icon:'⚡'},
              {title:'AI tutor (education only)',desc:'Subject‑aware, safe responses tailored to learning.',icon:'🧠'},
              {title:'Dark mode',desc:'Beautiful on the eyes for those late‑night sessions.',icon:'🌙'},
              {title:'Gamification',desc:'Points and levels to keep your streak alive.',icon:'🏆'}
            ].map((f,i)=> (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow border border-gray-100 dark:border-gray-700">
                <div className="text-2xl">{f.icon}</div>
                <h3 className="mt-2 font-semibold text-gray-900 dark:text-gray-100">{f.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Health Check Section
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
            Backend Connection Status
          </h2>
          <ApiHealthCheck />
        </div>
      </section> */}

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

      {/* Simple footer */}
      <footer className="px-6 pb-10">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© {new Date().getFullYear()} StudyHive. Built for students, by students.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;

