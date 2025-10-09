// import { Link } from 'ne';
import whatsappLogo from '../../assets/img/footer/WhatsappLogo.png'
import LinkedInLogo from '../../assets/img/footer/linkedInLogo.png'
import InstagramLogo from '../../assets/img/footer/InstagramLogo.png'
import FacebookLogo from '../../assets/img/footer/FacebookLogo.png'
import TelegramLogo from '../../assets/img/footer/TelegramLogo.png'
import Link from 'next/link'
import Image from 'next/image'

const Footer_01 = () => {

    return (
        <footer className='px-3 relative z-[1] overflow-hidden bg-colorLinenRuffle w-full'>
            {/* Footer Top */}

            {/* Footer Text Slider */}
            {/* Footer Top */}
            <div className='global-container'>
                <div className='h-[1px] w-full bg-[#DBD6CF]' />
                {/* Footer Center */}
                <div className='lg grid grid-cols-1 gap-4 py-6 px-6 md:grid-cols-[1fr_1fr] xl:grid-cols-[1fr_1fr] xl:gap-8 xl:py-8'>
                    {/* Footer Widget */}

                    {/* Footer Widget */}
                    {/* Footer Widget */}
                    <div className='flex flex-row justify-between px-3 md:px-0'>
                        <div className='flex flex-col gap-y-6'>
                            <h4 className='text-[18px] font-semibold capitalize text-white'>
                                Primary Pages
                            </h4>
                            <div className='flex flex-row justify-between gap-10' >
                                <div>
                                    <ul className='flex flex-col gap-y-[10px] capitalize'>
                                        <li className='flex justify-start items-center'>
                                            <Image width={28} height={19} className='w-[28px] h-[19px]' src="https://pub-61d4dfbb3f994132b575eee21fba10d6.r2.dev/rightArrow.png" alt="" />
                                            <Link href='/' className='text-sm transition-all duration-300 ease-linear hover:text-primaryColor'>Home</Link>
                                        </li>

                                        <li className='flex justify-start items-center'>
                                            <Image width={28} height={19} className='w-[28px] h-[19px]' src="https://pub-61d4dfbb3f994132b575eee21fba10d6.r2.dev/rightArrow.png" alt="" />
                                            <Link
                                                href='/contact'
                                                className='text-sm transition-all duration-300 ease-linear hover:text-primaryColor'
                                            >
                                                Contact
                                            </Link>
                                        </li>

                                        <li className='flex justify-start items-center'>
                                            <Image width={28} height={19} className='w-[28px] h-[19px]' src="https://pub-61d4dfbb3f994132b575eee21fba10d6.r2.dev/rightArrow.png" alt="" />
                                            <Link
                                                href='/about'
                                                className='text-sm transition-all duration-300 ease-linear hover:text-primaryColor'
                                            >
                                                About Us
                                            </Link>
                                        </li>
                                    </ul>
                                </div>

                            </div>

                        </div>
                        <div className='flex flex-col gap-y-6'>
                            <h4 className='text-[18px] font-semibold capitalize text-white'>
                                Legal & Support Info
                            </h4>
                            <div className='flex flex-row justify-between gap-10'>
                                <div>
                                    <ul className='flex flex-col gap-y-[10px] capitalize'>
                                        <li className='flex justify-start items-center'>
                                            <Image width={28} height={19} className='w-[28px] h-[19px]' src="https://pub-61d4dfbb3f994132b575eee21fba10d6.r2.dev/rightArrow.png" alt="" />
                                            <Link
                                                href='/Disclosure'
                                                className='text-sm transition-all duration-300 ease-linear hover:text-primaryColor'
                                            >
                                                Disclosure
                                            </Link>
                                        </li>
                                        <li className='flex justify-start items-center'>
                                            <Image width={28} height={19} className='w-[28px] h-[19px]' src="https://pub-61d4dfbb3f994132b575eee21fba10d6.r2.dev/rightArrow.png" alt="" />
                                            <Link
                                                href='/TermsOfUse'
                                                className='text-sm transition-all duration-300 ease-linear hover:text-primaryColor'
                                            >
                                                Terms of Use
                                            </Link>
                                        </li>
                                        <li className='flex justify-start items-center'>
                                            <Image width={28} height={19} className='w-[28px] h-[19px]' src="https://pub-61d4dfbb3f994132b575eee21fba10d6.r2.dev/rightArrow.png" alt="" />
                                            <Link
                                                href='/disclaimer'
                                                className='text-sm transition-all duration-300 ease-linear hover:text-primaryColor'
                                            >
                                                Disclaimer
                                            </Link>
                                        </li>
                                        <li className='flex justify-start items-center'>
                                            <Image width={28} height={19} className='w-[28px] h-[19px]' src="https://pub-61d4dfbb3f994132b575eee21fba10d6.r2.dev/rightArrow.png" alt="" />
                                            <Link
                                                href='/RATermsConditions'
                                                className='text-sm transition-all duration-300 ease-linear hover:text-primaryColor'
                                            >
                                                Minimum Mandatory <br />Terms & Conditions
                                            </Link>
                                        </li>
                                        <li className='flex justify-start items-center'>
                                            <Image width={28} height={19} className='w-[28px] h-[19px]' src="https://pub-61d4dfbb3f994132b575eee21fba10d6.r2.dev/rightArrow.png" alt="" />
                                            <Link
                                                href='/InvestorCharter'
                                                className='text-sm transition-all duration-300 ease-linear hover:text-primaryColor'
                                            >
                                                Investor Charter
                                            </Link>
                                        </li>
                                        <li className='flex justify-start items-center'>
                                            <Image width={28} height={19} className='w-[28px] h-[19px]' src="https://pub-61d4dfbb3f994132b575eee21fba10d6.r2.dev/rightArrow.png" alt="" />
                                            <Link
                                                href='/ComplaintData'
                                                className='text-sm transition-all duration-300 ease-linear hover:text-primaryColor'
                                            >
                                                Complaint Data
                                            </Link>
                                        </li>

                                    </ul>
                                </div>

                            </div>

                        </div>
                        <div className='flex flex-col gap-y-6'>
                            <h4 className='text-[18px] font-semibold capitalize text-white'>
                                Research Analyst Details
                            </h4>
                            <ul className='flex flex-col gap-y-[10px] capitalize'>
                                <li className='flex justify-start '>
                                    <Image width={28} height={19} className='w-[28px] h-[19px]' src="https://pub-61d4dfbb3f994132b575eee21fba10d6.r2.dev/rightArrow.png" alt="" />
                                    <div className='text-sm'><p>Sebi Registration ID: </p><p> INH000021377</p></div>
                                </li>
                                <li className='flex justify-start '>
                                    <Image width={28} height={19} className='w-[28px] h-[19px]' src="https://pub-61d4dfbb3f994132b575eee21fba10d6.r2.dev/rightArrow.png" alt="" />
                                    <div className='text-sm'><p>CIN No.: </p><p> U74999MH2021PTC359682</p></div>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className='flex flex-row justify-center px-3 md:px-0'>
                        <div>
                            <h4 className='text-[18px] font-semibold capitalize text-white'>
                                Follow Us On
                            </h4>
                            <div className='flex flex-row'>
                                <div className='w-1/3'><a href="https://www.linkedin.com/company/equivision-in/"><Image width={28} height={19} className='w-full' src="https://pub-61d4dfbb3f994132b575eee21fba10d6.r2.dev/linkedin-logo.png" alt="" /></a></div>
                            </div>
                        </div>



                    </div>
                </div>
                <div className="bg-equivision text-white mb-0.5">
                    <div className='h-[1px] w-full bg-[#DBD6CF]' />
                    <div className='py-3 text-center'>
                        <p className='text-sm'>
                            © Copyright {new Date().getFullYear()}, All Rights Reserved by
                            Beacon Capital Advisors Private Limited
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer_01;