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

export default function PrivacyPolicy() {
  const markdownContent = `
# Privacy Policy
**Effective Date:** January 15, 2025

At InboxClarity, we value your privacy and are committed to protecting your personal information. This Privacy Policy outlines how we collect, use, and share information when you use our services, including but not limited to email summaries and any associated mobile or web applications (collectively, the "Services").

---

## 1. Information We Collect

### 1.1 Information You Provide Directly
- **Personal Information:** When you sign up for InboxClarity, we collect information such as your name and email address.
- **Feedback:** If you contact us or provide feedback, we collect the information you share with us.

### 1.2 Information Collected Automatically
- **Usage Data:** When you interact with our website or app, we may collect non-identifiable information such as browser type, operating system, and timestamps.
- **Cookies:** We use cookies to improve your experience, track preferences, and analyze traffic.

---

## 2. How We Use Your Information

We use the information collected for the following purposes:
- To deliver InboxClarity’s daily email summaries.
- To improve and personalize our services.
- To communicate with you about your account or service updates.
- To analyze trends and gather insights to enhance the user experience.

---

## 3. How We Share Your Information

We do not sell your personal information. We may share your data with third parties in the following cases:
- **Service Providers:** To deliver emails, analyze user behavior, or manage infrastructure.
- **Legal Obligations:** If required by law or to protect our rights.
- **With Your Consent:** When you explicitly agree to share your information.

---

## 4. Google API Services

InboxClarity may use Google API Services to enhance our offerings. By using our Services:
- You agree to Google’s Privacy Policy.
- We will only access and use Google API data in ways that are compliant with Google’s API Services User Data Policy.
- We will not share or use your data for advertising purposes without your explicit consent.

---

## 5. Data Retention

We retain your information only as long as necessary to provide our Services or as required by law. You can request deletion of your data by contacting us.

---

## 6. Your Rights

- **Access and Update:** You can access or update your personal information at any time.
- **Opt-Out:** You can unsubscribe from emails using the link provided in each message.
- **Data Deletion:** Contact us to request the deletion of your data.

---

## 7. Security

We implement industry-standard security measures to protect your data. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.

---

## 8. Third-Party Links

Our emails or app may contain links to third-party websites or services. We are not responsible for their privacy practices or content.

---

## 9. Changes to This Privacy Policy

We may update this policy from time to time. Changes will be communicated through email or our website.

---

## 10. Contact Us

If you have questions or concerns about this Privacy Policy, contact us at:
- **Email:** ${SUPPORT_EMAIL}
- **Address:**  
  InboxClarity  
  30 N Gould St Ste N  
  Sheridan, Wyoming 82801  
  USA

---

**Your Time Matters. Your Privacy Does Too.**  
InboxClarity is committed to safeguarding your information and ensuring your inbox remains private and secure. Thank you for trusting us with your email management.
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
