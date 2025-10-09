"use client"

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Shield, Users, FileText, MessageSquare, Scale, CheckCircle, XCircle, LucideIcon } from 'lucide-react';
import Footer_01 from '@/components/ui/Footer';

interface SectionProps {
  children: React.ReactNode;
  title: string;
  icon: LucideIcon;
}

interface ResponsibilityItemProps {
  children: React.ReactNode;
  type?: 'do' | 'dont';
}

interface SectionItem {
  id: string;
  title: string;
  icon: LucideIcon;
}

const Page = () => {
  const [activeSection, setActiveSection] = useState<string>('vision');

  const sections: SectionItem[] = [
    { id: 'vision', title: 'Vision & Mission', icon: Shield },
    { id: 'business', title: 'Business Details', icon: FileText },
    { id: 'services', title: 'Services Provided', icon: Users },
    { id: 'grievance', title: 'Grievance Redressal', icon: MessageSquare },
    { id: 'rights', title: 'Investor Rights', icon: Scale },
    { id: 'responsibilities', title: 'Investor Responsibilities', icon: CheckCircle }
  ];

  const Section: React.FC<SectionProps> = ({ children, title, icon: Icon }) => (
    <div className="bg-gray-800 rounded-md shadow-sm border border-gray-700 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-3 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Icon className="h-4 w-4 text-blue-400" />
          <h2 className="text-base font-semibold text-gray-100">{title}</h2>
        </div>
      </div>
      <div className="p-3 text-xs text-gray-300">
        {children}
      </div>
    </div>
  );

  const BusinessDetails = () => (
    <div className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {[
          "Publish research reports based on RA research activities",
          "Provide independent unbiased view on securities",
          "Offer unbiased recommendations with disclosed financial interests",
          "Provide research recommendations based on publicly available information",
          "Conduct annual audits",
          "Ensure advertisement adherence to Advertisement Code",
          "Maintain records of all client interactions"
        ].map((item, index) => (
          <div key={index} className="flex items-start space-x-2 p-2 bg-gray-700 rounded-md">
            <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span className="text-gray-300">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const Services = () => (
    <div className="space-y-3">
      <div className="bg-blue-900/30 p-2 rounded-md">
        <h3 className="font-semibold text-blue-300 mb-1 text-xs">Client Onboarding</h3>
        <ul className="space-y-1">
          <li className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
            <span className="text-gray-300">Sharing terms and conditions of research services</span>
          </li>
          <li className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
            <span className="text-gray-300">Completing KYC of fee paying clients</span>
          </li>
        </ul>
      </div>

      <div className="bg-green-900/30 p-2 rounded-md">
        <h3 className="font-semibold text-green-300 mb-1 text-xs">Disclosure Requirements</h3>
        <div className="space-y-1">
          <p className="text-gray-300">• Material information for informed decision making</p>
          <p className="text-gray-300">• Extent of AI tool usage in research services</p>
          <p className="text-gray-300">• Third party research report conflicts of interest</p>
          <p className="text-gray-300">• Conflicts between research services and other activities</p>
        </div>
      </div>

      <div className="bg-purple-900/30 p-2 rounded-md">
        <h3 className="font-semibold text-purple-300 mb-1 text-xs">Service Standards</h3>
        <div className="space-y-1">
          <p className="text-gray-300">• Non-discriminatory distribution of research reports</p>
          <p className="text-gray-300">• Confidentiality until public domain release</p>
          <p className="text-gray-300">• Data privacy protection</p>
          <p className="text-gray-300">• Timeline disclosure and adherence</p>
          <p className="text-gray-300">• Clear guidance for complex/high-risk products</p>
        </div>
      </div>
    </div>
  );

  const GrievanceRedressal = () => (
    <div className="space-y-3">
      <div className="bg-yellow-900/30 border-l-4 border-yellow-600 p-2 rounded-md">
        <h3 className="font-semibold text-yellow-300 mb-1 text-xs">Direct Complaint to Research Analyst</h3>
        <p className="text-gray-300">Resolution within <span className="font-semibold">21 days</span> of receipt</p>
      </div>

      <div className="bg-red-900/30 border-l-4 border-red-600 p-2 rounded-md">
        <h3 className="font-semibold text-red-300 mb-1 text-xs">SCORES 2.0 Platform</h3>
        <p className="mb-1 text-gray-300">Web-based centralized grievance system</p>
        <a href="https://scores.sebi.gov.in" className="text-blue-400 hover:underline">https://scores.sebi.gov.in</a>
        <div className="mt-1 space-y-0.5">
          <p className="text-gray-300">• First review: RAASB (Research Analyst Administration and Supervisory Body)</p>
          <p className="text-gray-300">• Second review: SEBI</p>
        </div>
      </div>

      <div className="bg-gray-700 p-2 rounded-md">
        <h3 className="font-semibold text-gray-200 mb-1 text-xs">SMARTODR Platform</h3>
        <p className="text-gray-300">For resolution through online conciliation or arbitration if not satisfied with initial resolution</p>
      </div>

      <div className="bg-blue-900/30 p-2 rounded-md">
        <h3 className="font-semibold text-blue-300 mb-1 text-xs">Physical Complaints</h3>
        <div>
          <p className="text-gray-300">Office of Investor Assistance and Education</p>
          <p className="text-gray-300">Securities and Exchange Board of India</p>
          <p className="text-gray-300">SEBI Bhavan, Plot No. C4-A, 'G' Block</p>
          <p className="text-gray-300">Bandra-Kurla Complex, Bandra (E)</p>
          <p className="text-gray-300">Mumbai - 400 051</p>
        </div>
      </div>
    </div>
  );

  const InvestorRights = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {[
        "Privacy and Confidentiality",
        "Transparent Practices",
        "Fair and Equitable Treatment",
        "Adequate Information",
        "Initial and Continuing Disclosure",
        "Fair & True Advertisement",
        "Service Parameters Awareness",
        "Timely Grievance Redressal",
        "Exit Rights",
        "Clear Guidance for Complex Products",
        "Accessible Services for Differently Abled",
        "Feedback Rights",
        "Protection from Unfair Clauses"
      ].map((right, index) => (
        <div key={index} className="flex items-start space-x-2 p-2 bg-green-900/30 rounded-md">
          <Scale className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
          <span className="text-gray-300">{right}</span>
        </div>
      ))}
    </div>
  );

  const ResponsibilityItem: React.FC<ResponsibilityItemProps> = ({ children, type = 'do' }) => (
    <div className={`flex items-start space-x-2 p-2 rounded-md ${type === 'do' ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
      {type === 'do' ? (
        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
      )}
      <span className="text-gray-300">{children}</span>
    </div>
  );

  const InvestorResponsibilities = () => (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold text-green-300 mb-2 flex items-center text-xs">
          <CheckCircle className="h-4 w-4 mr-2" />
          Do's
        </h3>
        <div className="space-y-1">
          <ResponsibilityItem>Deal only with SEBI registered Research Analysts</ResponsibilityItem>
          <ResponsibilityItem>Verify valid registration certificate and SEBI registration number</ResponsibilityItem>
          <ResponsibilityItem>Pay attention to disclosures in research reports</ResponsibilityItem>
          <ResponsibilityItem>Make payments through banking channels only</ResponsibilityItem>
          <ResponsibilityItem>Check research recommendations before trading</ResponsibilityItem>
          <ResponsibilityItem>Ask relevant questions and clear doubts</ResponsibilityItem>
          <ResponsibilityItem>Seek clarifications for complex/high-risk products</ResponsibilityItem>
          <ResponsibilityItem>Be aware of your right to stop services</ResponsibilityItem>
          <ResponsibilityItem>Provide feedback on services received</ResponsibilityItem>
          <ResponsibilityItem>Report Research Analysts offering guaranteed returns to SEBI</ResponsibilityItem>
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-red-300 mb-2 flex items-center text-xs">
          <XCircle className="h-4 w-4 mr-2" />
          Don'ts
        </h3>
        <div className="space-y-1">
          <ResponsibilityItem type="dont">Provide funds for investment to Research Analyst</ResponsibilityItem>
          <ResponsibilityItem type="dont">Fall prey to luring advertisements or market rumors</ResponsibilityItem>
          <ResponsibilityItem type="dont">Get attracted to limited period discounts or incentives</ResponsibilityItem>
          <ResponsibilityItem type="dont">Share login credentials or passwords with Research Analyst</ResponsibilityItem>
        </div>
      </div>
    </div>
  );

  return (
    <>
    <div className="bg-[#0a0c10] min-h-screen">
      <div className="max-w-4xl mx-auto p-6 bg-gray-900 mt-[2.5rem]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">INVESTOR CHARTER</h1>
              <p className="text-sm text-blue-200">For Research Analysts (RA)</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-gray-800 shadow-sm border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-2 sm:px-4">
            <nav className="flex space-x-3 overflow-x-auto py-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex items-center space-x-1 px-2 py-1.5 rounded-md whitespace-nowrap transition-colors text-xs ${activeSection === section.id
                        ? 'bg-blue-900 text-blue-300'
                        : 'text-gray-400 hover:text-blue-400 hover:bg-gray-700'
                      }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="font-medium">{section.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 max-w-7xl mx-auto px-2 sm:px-4 py-4 w-full">
          {activeSection === 'vision' && (
            <Section title="Vision & Mission" icon={Shield}>
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-blue-300 mb-1 text-xs">Vision</h3>
                  <p className="text-xs text-gray-300">Invest with knowledge & safety.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-green-300 mb-1 text-xs">Mission</h3>
                  <p className="text-xs text-gray-300">
                    Every investor should be able to invest in right investment products based on their needs,
                    manage and monitor them to meet their goals, access reports and enjoy financial wellness.
                  </p>
                </div>
              </div>
            </Section>
          )}
          {activeSection === 'business' && (
            <Section title="Business Details" icon={FileText}>
              <BusinessDetails />
            </Section>
          )}
          {activeSection === 'services' && (
            <Section title="Services Provided" icon={Users}>
              <Services />
            </Section>
          )}
          {activeSection === 'grievance' && (
            <Section title="Grievance Redressal Mechanism" icon={MessageSquare}>
              <GrievanceRedressal />
            </Section>
          )}
          {activeSection === 'rights' && (
            <Section title="Investor Rights" icon={Scale}>
              <InvestorRights />
            </Section>
          )}
          {activeSection === 'responsibilities' && (
            <Section title="Investor Responsibilities" icon={CheckCircle}>
              <InvestorResponsibilities />
            </Section>
          )}
        </div>

        {/* Footer */}
        <footer className="bg-gray-800 text-white">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4">
            <div className="text-center">
              <p className="text-gray-400 text-xs">
                For more information, visit{' '}
                <a href="https://www.sebi.gov.in" className="text-blue-400 hover:underline">
                  SEBI Website
                </a>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
    <div className="mt-10 flex text-xs text-zinc-500">
        <Footer_01 />
      </div>
    </>
  );
};

export default Page;