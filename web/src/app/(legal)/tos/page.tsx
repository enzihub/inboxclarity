import React from 'react';
import ReactMarkdown from 'react-markdown';

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'the support address listed on this site';

const markdownComponents = {
  h1: ({ children }: any) => <h1 className='text-3xl md:text-4xl font-medium mb-8 text-gray-100 text-center tracking-tight'>{children}</h1>,
  h2: ({ children }: any) => (
    <h2 className='text-xl md:text-2xl font-medium mb-4 text-gray-200 border-b border-gray-700 pb-2 tracking-tight'>{children}</h2>
  ),
  h3: ({ children }: any) => <h3 className='text-lg md:text-xl font-medium mb-3 text-gray-300 tracking-tight'>{children}</h3>,
  p: ({ children }: any) => <p className='text-sm md:text-base text-gray-400 mb-6 leading-relaxed'>{children}</p>,
  ul: ({ children }: any) => <ul className='list-disc list-outside mb-6 text-gray-400 text-sm md:text-base ml-4'>{children}</ul>,
  ol: ({ children }: any) => <ol className='list-decimal list-outside mb-6 text-gray-400 text-sm md:text-base ml-4'>{children}</ol>,
  li: ({ children }: any) => <li className='mb-2'>{children}</li>,
  hr: () => <hr className='my-8 border-gray-700' />,
};

export default function TermsOfService() {
  const markdownContent = `

# Terms of Service  

**Effective Date:** January 15, 2025  

Welcome to **InboxClarity**, your personal email summarization assistant. These Terms of Service ("Terms") govern your access to and use of our services, including our daily email summaries and any associated websites, applications, or features (collectively, the "Services").  

By accessing or using our Services, you agree to be bound by these Terms. If you do not agree, please refrain from using our Services.  

---

## 1. Eligibility  

- **Minimum Age:** You must be at least 13 years old to use our Services.  
- **Compliance:** By using our Services, you represent and warrant that you comply with all applicable laws and regulations.  

---

## 2. Account Responsibilities  

- **Account Information:** You agree to provide accurate, complete, and updated information when signing up for our Services.  
- **Account Security:** You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.  
- **Unauthorized Access:** Notify us immediately at ${SUPPORT_EMAIL} if you suspect any unauthorized use of your account.  

---

## 3. Use of Services  

- **Permitted Use:** You may use our Services for personal, non-commercial purposes in compliance with these Terms.  
- **Prohibited Use:** You agree not to:  
  - Access or use our Services for any unlawful or harmful activities.  
  - Interfere with the operation of the Services or access them using unauthorized methods (e.g., automated bots or scraping).  
  - Reproduce, distribute, or modify any part of the Services without prior written consent.  

---

## 4. Intellectual Property  

- All content, trademarks, logos, and other materials provided through the Services are owned by InboxClarity or its licensors.  
- You may not use, copy, or distribute these materials without explicit written permission, except as expressly allowed by these Terms.  

---

## 5. Privacy  

Your use of our Services is governed by our Privacy Policy, which explains how we collect, use, and protect your data. By using the Services, you consent to our collection and use of your data as described in the Privacy Policy.  

---

## 6. Google API Services  

If our Services use Google API Services, you agree to the following:  
- **Privacy Compliance:** Your use is subject to Google’s [Privacy Policy](https://policies.google.com/privacy).  
- **Data Use:** We access and use Google API data only as permitted by Google’s [API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy).  
- **No Advertising Use:** Your Google data will not be shared or used for advertising purposes without your explicit consent.  

---

## 7. Modifications to Services  

- We may update, suspend, or discontinue the Services or any part thereof at our discretion and without notice.  
- We are not liable for any modification, suspension, or discontinuation of the Services.  

---

## 8. Third-Party Links  

Our Services may include links to third-party websites or services. These links are provided for convenience, and InboxClarity is not responsible for the content or privacy practices of those third-party sites. Use them at your own risk.  

---

## 9. Limitation of Liability  

- **As-Is Basis:** The Services are provided "as-is" and "as available" without warranties of any kind, express or implied.  
- **No Liability:** To the maximum extent permitted by law, InboxClarity is not liable for any indirect, incidental, or consequential damages arising from your use of the Services.  

---

## 10. Indemnification  

You agree to indemnify, defend, and hold harmless InboxClarity, its affiliates, officers, and employees from any claims, liabilities, damages, or expenses (including legal fees) arising from:  
- Your use or misuse of the Services.  
- Your violation of these Terms.  

---

## 11. Termination  

- We reserve the right to suspend or terminate your access to the Services if you violate these Terms or engage in prohibited activities.  
- Upon termination, your rights to use the Services will immediately cease.  

---

## 12. Governing Law  

These Terms are governed by and construed in accordance with the laws of the State of Wyoming, USA. Any disputes arising under these Terms will be subject to the exclusive jurisdiction of the courts located in Wyoming.  

---

## 13. Changes to These Terms  

We may revise these Terms from time to time. Significant changes will be communicated through email or our website. Your continued use of the Services constitutes acceptance of the revised Terms.  

---

## 14. Contact Information  

If you have any questions, concerns, or feedback about these Terms, please contact us:  
- **Email:** ${SUPPORT_EMAIL}  
**Address:**  
InboxClarity  
30 N Gould St Ste N  
Sheridan, Wyoming 82801  
USA  

---

**Start Your Day with Confidence, Not Chaos.**  
InboxClarity is here to streamline your email chaos and help you reclaim your time with a concise daily executive summary. Let’s conquer your inbox together!  

  `;

  return (
    <div className='w-full bg-black'>
      <div className='max-w-3xl mx-auto px-4 md:px-6'>
        <div className='rounded-lg mt-16 mb-16'>
          <div className='overflow-y-auto px-6 md:px-8 py-8 scrollbar-thin scrollbar-thumb-gray-700 hover:scrollbar-thumb-gray-600 scrollbar-track-transparent'>
            <div className='prose prose-invert max-w-none'>
              <ReactMarkdown components={markdownComponents}>{markdownContent}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
