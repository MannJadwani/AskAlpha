"use client"

import React, { useState, FormEvent, ChangeEvent, MouseEvent } from 'react';

interface FormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
}

interface SubmittedData {
  name: string;
  email: string;
  phone: string;
  company?: string;
}

const Contact_From = () => {
  const [input, setInput] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showThanks, setShowThanks] = useState<boolean>(false);
  const [submittedData, setSubmittedData] = useState<SubmittedData>({
    name: '',
    email: '',
    phone: '',
    company: ''
  });

  const handleInput = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const showAlert = (title: string, message: string, type: string) => {
    // Using a simple alert for now since sweetalert might not be available
    alert(`${title}: ${message}`);
  };

  const handleSubmit = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    
    // Validation
    if (!input.name || !input.email || !input.phone || !input.message) {
      showAlert('Error', 'Please fill in all required fields', 'error');
      return;
    }

    setIsSubmitting(true);

    // Generate HTML content with proper variable references
    const htmlContent = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <html dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
     <head>
      <meta charset="UTF-8">
      <meta content="width=device-width, initial-scale=1" name="viewport">
      <meta name="x-apple-disable-message-reformatting">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta content="telephone=no" name="format-detection">
      <title>New Contact Form Submission</title>
      <style type="text/css">
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: #0f1011; color: #ffffff; padding: 30px; border-radius: 15px; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #ffffff; font-size: 28px; margin: 0; }
        .content { background-color: #1a1a1a; padding: 20px; border-radius: 10px; border: 1px solid #35ccd0; }
        .field { margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #35ccd0; }
        .field:last-child { border-bottom: none; }
        .field-label { font-weight: bold; color: #35ccd0; font-size: 16px; }
        .field-value { margin-top: 5px; font-size: 14px; line-height: 1.5; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #999; }
      </style>
     </head>
     <body>
      <div class="container">
        <div class="header">
          <h1>New Enquiry from Equivision Website</h1>
        </div>
        <div class="content">
          <div class="field">
            <div class="field-label">Name:</div>
            <div class="field-value">${input.name}</div>
          </div>
          <div class="field">
            <div class="field-label">Email:</div>
            <div class="field-value">${input.email}</div>
          </div>
          <div class="field">
            <div class="field-label">Phone:</div>
            <div class="field-value">${input.phone}</div>
          </div>
          <div class="field">
            <div class="field-label">Company:</div>
            <div class="field-value">${input.company || 'Not provided'}</div>
          </div>
          <div class="field">
            <div class="field-label">Message:</div>
            <div class="field-value">${input.message}</div>
          </div>
        </div>
        <div class="footer">
          <p>This is an automated email from the Equivision contact form.</p>
        </div>
      </div>
     </body>
    </html>`;

    const emailData = {
      sender: {
        name: "Debtcircle",
        email: "research@debtcircle.in"
      },
      to: [
        {
          email: "research@equivision.in",
          name: "equivision"
        }
      ],
      htmlContent: htmlContent,
      subject: "Contact Form - Equivision Website",
      tags: ["contact-form", "website"]
    };

    try {
      console.log('Sending email with data:', emailData);
      
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'api-key': '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',
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send email');
      }

      const responseData = await response.json();
      console.log('Email sent successfully:', responseData);
      
      // Store submitted data before resetting form
      setSubmittedData({
        name: input.name,
        email: input.email,
        phone: input.phone,
        company: input.company
      });
      
      // Reset form
      setInput({
        name: '',
        email: '',
        phone: '',
        company: '',
        message: '',
      });
      
      // Show thank you message instead of alert
      setShowThanks(true);
      
    } catch (error) {
      console.error('Error sending email:', error);
      showAlert('Error', `Failed to send message: ${(error as Error).message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowThanks(false);
    setSubmittedData({
      name: '',
      email: '',
      phone: '',
      company: ''
    });
    setInput({
      name: '',
      email: '',
      phone: '',
      company: '',
      message: '',
    });
  };

  // Thank You Message Component
  if (showThanks) {
    return (
      <div className='order-1 block rounded-[30px] bg-gray-800 px-[30px] py-[50px] lg:w-[70%] xl:w-[100%] shadow-[0_4px_60px_0_rgba(0,0,0,0.1)] md:order-2 border border-gray-700'>
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-900/30">
            <svg className="h-10 w-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          {/* Thank You Message */}
          <h2 className="text-3xl font-bold text-gray-100 mb-4">Thank You!</h2>
          <p className="text-lg text-gray-300 mb-6">
            Your message has been sent successfully. We'll get back to you soon!
          </p>
          
          {/* Details */}
          <div className="bg-gray-700 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-300 mb-2">
              <span className="font-semibold">Name:</span> {submittedData.name}
            </p>
            <p className="text-sm text-gray-300 mb-2">
              <span className="font-semibold">Email:</span> {submittedData.email}
            </p>
            <p className="text-sm text-gray-300 mb-2">
              <span className="font-semibold">Phone:</span> {submittedData.phone}
            </p>
            {submittedData.company && (
              <p className="text-sm text-gray-300">
                <span className="font-semibold">Company:</span> {submittedData.company}
              </p>
            )}
          </div>
          
          {/* Action Button */}
          <button 
            onClick={resetForm}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-2xl transition-all"
          >
            Send Another Message
          </button>
          
          {/* Additional Info */}
          <div className="mt-6 text-sm text-gray-400">
            <p>We typically respond within 24 hours</p>
            <p>Check your email for a confirmation</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='order-1 block rounded-[30px] bg-gray-800 px-[30px] py-[20px] lg:w-[70%] xl:w-[90%] shadow-[0_4px_60px_0_rgba(0,0,0,0.1)] md:order-2 border border-gray-700'>
      {/* Contact Form */}
      <div className="text-gray-100 text-center text-3xl font-bold">Contact Us</div>
      <br />
      <form className='flex flex-col gap-y-5'>
        {/* Form Group */}
        <div className='grid grid-cols-1 gap-6 xl:grid-cols-2'>
          {/* Form Single Input */}
          <div className='flex flex-col gap-y-[10px]'>
            <label htmlFor='contact-name' className='text-lg font-bold leading-[1.6] text-gray-100'>
              Enter your name <b className='text-red-400'>*</b>
            </label>
            <input 
              type='text' 
              name='name' 
              value={input.name} 
              onChange={handleInput} 
              id='contact-name' 
              placeholder='Adam Smith' 
              className='rounded-[10px] border border-gray-600 bg-gray-700 px-6 py-[18px] font-bold text-gray-100 outline-none transition-all placeholder:text-gray-400 focus:border-blue-500' 
              required 
            />
          </div>
          <div className='flex flex-col gap-y-[10px]'>
            <label htmlFor='contact-email' className='text-lg font-bold leading-[1.6] text-gray-100'>
              Email address <b className='text-red-400'>*</b>
            </label>
            <input 
              type='email' 
              name='email' 
              value={input.email} 
              onChange={handleInput} 
              id='contact-email' 
              placeholder='example@gmail.com' 
              className='rounded-[10px] border border-gray-600 bg-gray-700 px-6 py-[18px] font-bold text-gray-100 outline-none transition-all placeholder:text-gray-400 focus:border-blue-500' 
              required 
            />
          </div>
        </div>
        {/* Form Group */}
        <div className='grid grid-cols-1 gap-6 xl:grid-cols-2'>
          {/* Form Single Input */}
          <div className='flex flex-col gap-y-[10px]'>
            <label htmlFor='contact-phone' className='text-lg font-bold leading-[1.6] text-gray-100'>
              Phone number <b className='text-red-400'>*</b>
            </label>
            <input 
              type='tel' 
              name='phone' 
              value={input.phone} 
              onChange={handleInput} 
              id='contact-phone' 
              placeholder='+880-1345-922210' 
              className='rounded-[10px] border border-gray-600 bg-gray-700 px-6 py-[18px] font-bold text-gray-100 outline-none transition-all placeholder:text-gray-400 focus:border-blue-500' 
              required 
            />
          </div>
          {/* Form Single Input */}
          <div className='flex flex-col gap-y-[10px]'>
            <label htmlFor='contact-company' className='text-lg font-bold leading-[1.6] text-gray-100'>
              Company
            </label>
            <input 
              type='text' 
              name='company' 
              value={input.company} 
              onChange={handleInput} 
              id='contact-company' 
              placeholder='EX Facebook' 
              className='rounded-[10px] border border-gray-600 bg-gray-700 px-6 py-[18px] font-bold text-gray-100 outline-none transition-all placeholder:text-gray-400 focus:border-blue-500' 
            />
          </div>
        </div>
        {/* Form Group */}
        <div className='grid grid-cols-1 gap-6'>
          {/* Form Single Input */}
          <div className='flex flex-col gap-y-[10px]'>
            <label htmlFor='contact-message' className='text-lg font-bold leading-[1.6] text-gray-100'>
              Message <b className='text-red-400'>*</b>
            </label>
            <textarea 
              name='message' 
              value={input.message} 
              onChange={handleInput} 
              id='contact-message' 
              className='min-h-[180px] rounded-[10px] border border-gray-600 bg-gray-700 px-6 py-[18px] font-bold text-gray-100 outline-none transition-all placeholder:text-gray-400 focus:border-blue-500' 
              placeholder='Write your message here...' 
              required 
            />
          </div>
        </div>
        <div className='text-center'>
          <button 
            type='button' 
            disabled={isSubmitting}
            onClick={handleSubmit}
            className={`font-open font-bold text-[16px] leading-[20px] mt-5 rounded-2xl py-4 text-white w-full text-center transition-all ${
              isSubmitting 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? 'Sending...' : 'Send your message'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Contact_From;