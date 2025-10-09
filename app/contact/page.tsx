"use client"

import React from 'react';
import Contact_From from '../components/Contact_From';
import Footer_01 from '@/components/ui/Footer';


const Page = () => {
  return (
    <div className='max-w-9xl mx-auto p-2 sm:p-16 bg-[#0a0c10] min-h-screen pt-16 mt-[2.5rem]'>
      <div className="w-full">
        <div className="relative w-full flex flex-col lg:block">
          {/* Div 1 - Background Section */}
          <div
            style={{
              backgroundImage: 'url(assets/gradient_bg.png)',
              height: '500px',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            className="w-full h-[500px] p-8 text-white"
          >
            <div className="mx-auto mt-12 md:mx-0 md:max-w-none w-full sm:w-1/2 font-sans">
              <h2 className="sm:text-[50px] lg:text-[60px] xl:text-[70px] xxl:text-[80px]" style={{ fontWeight: 700 }}>
                Get in touch with us directly
              </h2>
              <br />
              <p className="mb-7 w-full sm:w-4/5 text-[16px] sm:text-[20px] leading-[28px] sm:leading-[32px] font-normal">
                We are here to help you! Tell us how we can help &amp; we'll be in touch with an expert within the next 2 working days.
              </p>
            </div>
          </div>

          {/* Div 2 - Contact Us Box (Moved Right and Down on Large Screens) */}
          <div className="w-full sm:w-[750px] rounded-lg p-6 mx-auto -mt-10 lg:absolute lg:left-[80%] xl:left-[75%] lg:-translate-x-1/2 lg:-translate-y-1/3 xl:-translate-y-[45%] xxl:-translate-y-[45%]">
            <Contact_From />
          </div>
        </div>

        {/* Div 3 - Contact Info (Shifted Left on Large Screens) */}
        <div className="w-full p-6 mt-6">
          <ul className="mt-12 mx-2 sm:mx-12 flex flex-col gap-y-8 lg:gap-y-12">
            <div className="flex flex-col sm:flex-row bg-gray-800 p-4 rounded-2xl sm:w-[400px] lg:w-[40%] border border-gray-700">
              <img src="assets/envelope-fill.svg" className="align-middle bg-equivision bg-clip-text text-transparent mx-4 mt-1" alt="" width={25} height={25} />
              <a href="mailto:research@equivision.in" className="align-middle xs:text-xl sm:text-2xl font-normal leading-loose hover:text-blue-400 text-gray-300">
                research@equivision.in
              </a>
            </div>
            <div className="flex flex-col sm:flex-row bg-gray-800 p-4 rounded-2xl sm:w-[400px] lg:w-[40%] border border-gray-700">
              <img src="assets/telephone-fill.svg" className="align-middle bg-equivision bg-clip-text text-transparent mx-4 mt-1" alt="" width={25} height={25} />
              <a href="tel:+91 8828305996" className="xs:text-xl sm:text-2xl font-normal leading-loose hover:text-blue-400 text-gray-300">
                +91 8828305996
              </a>
            </div>
            <div className="flex flex-col sm:flex-row bg-gray-800 p-4 rounded-2xl sm:w-[400px] lg:w-[40%] border border-gray-700">
              <img src="assets/geo-alt-fill.svg" className="align-middle bg-equivision bg-clip-text text-transparent mx-4 mt-1" alt="" width={35} height={35} />
              <a className="xs:text-lg sm:text-xl font-normal leading-loose hover:text-blue-400 text-gray-300">
                5W, 5th Floor, The Metropolitan, E-Block, Bandra Kurla Complex, Bandra (E), Mumbai 400051
              </a>
            </div>

            <li className="flex flex-col gap-y-4 text-2xl font-bold text-gray-300">
              Follow us:
              <ul className="mt-auto flex gap-x-[15px]">
                <li>
                  <div className="flex flex-row justify-between">
                    <div className="w-[25%]"><a href="https://www.linkedin.com/company/equivision-in"><img className="w-[43px] rounded-full" src="https://pub-61d4dfbb3f994132b575eee21fba10d6.r2.dev/linkedin-logo.png" alt="no image" /></a></div>
                    <div className="w-[25%]"><a href="https://whatsapp.com/channel/0029VanPpiS0VycNkc34dg0A"><img className="w-[43px] rounded-full" src="https://pub-61d4dfbb3f994132b575eee21fba10d6.r2.dev/whatsapp_colorful_logo.jpg" alt="no image" /></a></div>
                    <div className="w-[25%]"><a href="https://t.me/EquiVision"><img className="w-[43px] rounded-full" src="assets/telegram-image.png" alt="no image" /></a></div>
                  </div>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
      <div className="mt-10 flex text-xs text-zinc-500">
        <Footer_01 />
      </div>
    </div>
  );
};

export default Page;