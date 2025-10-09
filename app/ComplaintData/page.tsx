"use client"

import React from 'react';
import { FileText, TrendingUp, AlertCircle } from 'lucide-react';
import Footer_01 from '@/components/ui/Footer';

interface TableRow {
  sr: number;
  month?: string;
  year?: string;
}

const monthlyRows: TableRow[] = [
  { sr: 1, month: 'April, YYYY' },
  { sr: 2, month: 'May, YYYY' },
  { sr: 3, month: 'June, YYYY' },
  { sr: 4, month: '……………….' },
  { sr: 5, month: 'March, YYYY' },
];

const annualRows: TableRow[] = [
  { sr: 1, year: '2024-25' },
  { sr: 2, year: '2025-26' },
  { sr: 3, year: '2026-27' },
  { sr: 4, year: '20XX-XX' },
];

const Page = () => {
  return (
    <div className="min-h-screen bg-[#0a0c10] p-6 mt-[3rem]">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-5 mb-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-bold text-gray-100 uppercase">ANNEXURE E</h1>
          </div>
          <div className="mb-1 text-base font-semibold text-gray-300">COMPLAINT DATA TO BE DISPLAYED BY RAs</div>
          <p className="text-sm text-gray-300 mb-2">
            Formats for investors complaints data to be disclosed monthly by RAs on their website/mobile application:
          </p>
          <div className="mb-2 text-sm text-gray-300 font-medium">
            Data for the month ending - <span className="border-b border-gray-500 px-10"></span>
          </div>
        </div>

        {/* Complaints Data Table */}
        <div className="bg-gray-800 rounded-lg shadow p-5 mb-6 border border-gray-700">
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full border-collapse border border-gray-600 text-xs">
              <thead>
                <tr className="bg-gray-700">
                  <th className="border border-gray-600 px-2 py-1 text-gray-200">Sr. No.</th>
                  <th className="border border-gray-600 px-2 py-1 text-gray-200">Received from</th>
                  <th className="border border-gray-600 px-2 py-1 text-gray-200">Pending at the end of last month</th>
                  <th className="border border-gray-600 px-2 py-1 text-gray-200">Received</th>
                  <th className="border border-gray-600 px-2 py-1 text-gray-200">Resolved*</th>
                  <th className="border border-gray-600 px-2 py-1 text-gray-200">Total Pending#</th>
                  <th className="border border-gray-600 px-2 py-1 text-gray-200">Pending complaints &gt; 3 months</th>
                  <th className="border border-gray-600 px-2 py-1 text-gray-200">Average Resolution time^ (in days)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-gray-700">
                  <td className="border border-gray-600 px-2 py-1 text-gray-300">1</td>
                  <td className="border border-gray-600 px-2 py-1 font-medium text-gray-300">Directly from Investors</td>
                  <td className="border border-gray-600 px-2 py-1"></td>
                  <td className="border border-gray-600 px-2 py-1"></td>
                  <td className="border border-gray-600 px-2 py-1"></td>
                  <td className="border border-gray-600 px-2 py-1"></td>
                  <td className="border border-gray-600 px-2 py-1"></td>
                  <td className="border border-gray-600 px-2 py-1"></td>
                </tr>
                <tr className="hover:bg-gray-700">
                  <td className="border border-gray-600 px-2 py-1 text-gray-300">2</td>
                  <td className="border border-gray-600 px-2 py-1 font-medium text-gray-300">SEBI (SCORES)</td>
                  <td className="border border-gray-600 px-2 py-1"></td>
                  <td className="border border-gray-600 px-2 py-1"></td>
                  <td className="border border-gray-600 px-2 py-1"></td>
                  <td className="border border-gray-600 px-2 py-1"></td>
                  <td className="border border-gray-600 px-2 py-1"></td>
                  <td className="border border-gray-600 px-2 py-1"></td>
                </tr>
                <tr className="hover:bg-gray-700">
                  <td className="border border-gray-600 px-2 py-1 text-gray-300">3</td>
                  <td className="border border-gray-600 px-2 py-1 font-medium text-gray-300">Other Sources (if any)</td>
                  <td className="border border-gray-600 px-2 py-1"></td>
                  <td className="border border-gray-600 px-2 py-1"></td>
                  <td className="border border-gray-600 px-2 py-1"></td>
                  <td className="border border-gray-600 px-2 py-1"></td>
                  <td className="border border-gray-600 px-2 py-1"></td>
                  <td className="border border-gray-600 px-2 py-1"></td>
                </tr>
                <tr className="bg-gray-700 font-semibold">
                  <td className="border border-gray-600 px-2 py-1 text-gray-200" colSpan={2}>Grand Total</td>
                  <td className="border border-gray-600 px-2 py-1"></td>
                  <td className="border border-gray-600 px-2 py-1"></td>
                  <td className="border border-gray-600 px-2 py-1"></td>
                  <td className="border border-gray-600 px-2 py-1"></td>
                  <td className="border border-gray-600 px-2 py-1"></td>
                  <td className="border border-gray-600 px-2 py-1"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Impersonation complaints */}
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-gray-300">
                Number of complaints received during month against the RA due to impersonation by some other entity:
              </span>
              <span className="border-b border-gray-500 w-32"></span>
            </div>
            <div className="bg-yellow-900/30 border-l-4 border-yellow-600 p-3 text-xs text-gray-300 rounded">
              <span className="font-semibold">Note:</span> In case of any complaints received against the RA due to impersonation of the RA by some other entity, the RA may adjust the number of such complaints from total number of received/resolved complaints while preparing the above table. Further, RA must close such impersonation related complaints after following the due process as specified by SEBI/ RAASB.
            </div>
          </div>

          {/* Footnotes */}
          <div className="text-xs text-gray-300 space-y-1 mt-2">
            <p><b>*</b> Inclusive of complaints of previous months resolved in the current month.</p>
            <p><b>#</b> Inclusive of complaints pending as on the last day of the month.</p>
            <p><b>^</b> Average Resolution time is the sum total of time taken to resolve each complaint, in days, in the current month divided by total number of complaints resolved in the current month.</p>
          </div>
        </div>

        {/* Monthly Disposal Trend */}
        <div className="bg-gray-800 rounded-lg shadow p-5 mb-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h2 className="text-base font-semibold text-gray-100">Trend of monthly disposal of complaints</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-600 text-xs">
              <thead>
                <tr className="bg-gray-700">
                  <th className="border border-gray-600 px-3 py-2 text-gray-200">Sr. No.</th>
                  <th className="border border-gray-600 px-3 py-2 text-gray-200">Month</th>
                  <th className="border border-gray-600 px-3 py-2 text-gray-200">Carried forward from previous month</th>
                  <th className="border border-gray-600 px-3 py-2 text-gray-200">Received</th>
                  <th className="border border-gray-600 px-3 py-2 text-gray-200">Resolved*</th>
                  <th className="border border-gray-600 px-3 py-2 text-gray-200">Pending#</th>
                </tr>
              </thead>
              <tbody>
                {monthlyRows.map(row => (
                  <tr key={row.sr} className="hover:bg-gray-700">
                    <td className="border border-gray-600 px-3 py-2 text-gray-300">{row.sr}</td>
                    <td className="border border-gray-600 px-3 py-2 text-gray-300">{row.month}</td>
                    <td className="border border-gray-600 px-3 py-2"></td>
                    <td className="border border-gray-600 px-3 py-2"></td>
                    <td className="border border-gray-600 px-3 py-2"></td>
                    <td className="border border-gray-600 px-3 py-2"></td>
                  </tr>
                ))}
                <tr className="bg-gray-700 font-semibold">
                  <td className="border border-gray-600 px-3 py-2 text-gray-200" colSpan={2}>Grand Total</td>
                  <td className="border border-gray-600 px-3 py-2"></td>
                  <td className="border border-gray-600 px-3 py-2"></td>
                  <td className="border border-gray-600 px-3 py-2"></td>
                  <td className="border border-gray-600 px-3 py-2"></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-xs text-gray-300">
            <p className="mb-1"><b>*</b> Inclusive of complaints of previous months resolved in the current month.</p>
            <p><b>#</b> Inclusive of complaints pending as on the last day of the month.</p>
          </div>
        </div>

        {/* Annual Disposal Trend */}
        <div className="bg-gray-800 rounded-lg shadow p-5 mb-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-semibold text-gray-100">Trend of annual disposal of complaints</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-600 text-xs">
              <thead>
                <tr className="bg-gray-700">
                  <th className="border border-gray-600 px-3 py-2 text-gray-200">Sr. No.</th>
                  <th className="border border-gray-600 px-3 py-2 text-gray-200">Year</th>
                  <th className="border border-gray-600 px-3 py-2 text-gray-200">Carried forward from previous year</th>
                  <th className="border border-gray-600 px-3 py-2 text-gray-200">Received</th>
                  <th className="border border-gray-600 px-3 py-2 text-gray-200">Resolved*</th>
                  <th className="border border-gray-600 px-3 py-2 text-gray-200">Pending#</th>
                </tr>
              </thead>
              <tbody>
                {annualRows.map(row => (
                  <tr key={row.sr} className="hover:bg-gray-700">
                    <td className="border border-gray-600 px-3 py-2 text-gray-300">{row.sr}</td>
                    <td className="border border-gray-600 px-3 py-2 text-gray-300">{row.year}</td>
                    <td className="border border-gray-600 px-3 py-2"></td>
                    <td className="border border-gray-600 px-3 py-2"></td>
                    <td className="border border-gray-600 px-3 py-2"></td>
                    <td className="border border-gray-600 px-3 py-2"></td>
                  </tr>
                ))}
                <tr className="bg-gray-700 font-semibold">
                  <td className="border border-gray-600 px-3 py-2 text-gray-200" colSpan={2}>Grand Total</td>
                  <td className="border border-gray-600 px-3 py-2"></td>
                  <td className="border border-gray-600 px-3 py-2"></td>
                  <td className="border border-gray-600 px-3 py-2"></td>
                  <td className="border border-gray-600 px-3 py-2"></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-xs text-gray-300">
            <p className="mb-1"><b>*</b> Inclusive of complaints of previous years resolved in the current year.</p>
            <p><b>#</b> Inclusive of complaints pending as on the last day of the year.</p>
          </div>
        </div>
      </div>
      <div className="mt-10 flex text-xs text-zinc-500">
        <Footer_01 />
      </div>
    </div>
  );
};

export default Page;