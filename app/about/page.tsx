"use client"

import Footer_01 from '@/components/ui/Footer';
import Link from 'next/link';

const Page = () => {
  return (
    <>
      <div className="bg-[#0a0c10] min-h-screen py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-green-400 to-blue-500 bg-clip-text text-transparent">
              About EquiVision
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
              Empowering India's SME sector with research-driven insights and strategic investor relations.
            </p>
          </div>

          {/* Mission Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-blue-400 mb-3">Our Mission</h2>
            <p className="text-gray-300 text-base sm:text-lg">
              To empower investors with high-quality research and strategic business support, enabling them to make informed decisions across diverse opportunities. We aim to deliver actionable insights that foster financial success and unlock growth potential in one of the world's most dynamic economies.
            </p>
          </section>

          {/* Vision Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-green-400 mb-3">Our Vision</h2>
            <p className="text-gray-300 text-base sm:text-lg">
              To be a leading research and solutions partner delivering insightful analysis, strategic guidance, and innovative methodologies that empower businesses and decision-makers to thrive in an ever-evolving economic landscape.
            </p>
          </section>

          {/* Values Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-blue-400 mb-3">Our Values</h2>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li><span className="font-semibold text-green-400">Integrity:</span> We stand for transparency, independence, and ethical research.</li>
              <li><span className="font-semibold text-green-400">Innovation:</span> We use smart tools and fresh thinking to stay ahead.</li>
              <li><span className="font-semibold text-green-400">Impact:</span>Focused on delivering clarity, value, and real results.</li>
              <li><span className="font-semibold text-green-400">Client-Centricity:</span> Every insight is tailored to your goals and strategy.</li>
              <li><span className="font-semibold text-green-400">Expertise:</span>Driven by deep financial insight and disciplined analysis.</li>
            </ul>
          </section>

          {/* Unique Approach Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-green-400 mb-3">What Sets Us Apart</h2>
            <ul className="space-y-3 text-gray-300">
              <li><span className="font-semibold text-blue-400">Integrated Solutions:</span> We blend rigorous equity research with strategic investor relations for holistic market positioning.</li>
              <li><span className="font-semibold text-blue-400">SME Focus:</span> Our deep sector expertise enables us to address the unique challenges and opportunities of India's mid-cap and SME landscape.</li>
              <li><span className="font-semibold text-blue-400">Results-Driven:</span> We deliver actionable recommendations and measurable outcomes, from investment guidance to IR strategy execution.</li>
              <li><span className="font-semibold text-blue-400">Customized Engagement:</span> Our services are tailored to your stage—whether pre-IPO, post-listing, or scaling for growth.</li>
            </ul>
          </section>

          {/* Call to Action */}
          <div className="text-center mt-16">
            <h3 className="text-xl font-bold mb-4 text-blue-400">Ready to Transform Your Growth Journey?</h3>
            <Link href="/contact" className="inline-block px-8 py-3 bg-gradient-to-r from-green-600 to-blue-700 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
              Schedule a Consultation
            </Link>
          </div>
        </div>
      </div>
      <div className="mt-10 flex text-xs text-zinc-500">
        <Footer_01 />
      </div>
    </>
  );
};

export default Page;