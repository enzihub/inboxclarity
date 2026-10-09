# prompts.py

TRANSCRIPT_SUMMARY_PROMPT = """
I have a detailed transcript about {video_title}, and I’d like you to summarize it in a clean, tidy, and well-organized manner. Present the content in a first-person perspective, using a style similar to the original transcript but with improved formatting to make it visually appealing, entertaining and easy to follow. The summary should capture all key details and be formatted in a way that's clear, professional, and engaging.

Title: {video_title}
Content: {transcript_text}
Output format : your response must be directly a <div> tag in HTML. Literally have only the <div> tag and the transcript summary content inside it.
Use proper html tags to present the content in a structured manner. Avoid the video title in your response because it's handled separately. 
DO NOT INCLUDE BACKTICKS IN THE RESPONSE
Eg. 
<div>
YOUR RESPONSE CONTENT
</div>
"""

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
SLACK_SUMMARY_PROMPT = """
You are a Summarization Tool that converts team chat logs into structured Morning Brief Executive Reports. Process the chat logs (provided within triple backticks) to capture team activities, decisions, and developments.

Instructions:
1. Output should be structured HTML wrapped in <div></div> tags
2. Provide raw HTML without backticks
3. Focus on clarity and readability

Required Report Sections:
1. Executive Summary - Brief overview of main developments and current status
2. Key Achievements - Major accomplishments with impact assessment
3. Strategic Initiatives - Progress updates on long-term projects
4. Active Tasks - Current work status with ownership details
5. Upcoming Deadlines - Important dates and milestones
6. Resource Status - Current allocation and needs
7. Team Updates - Personnel news and internal announcements
8. Key Learnings - Insights from recent activities
9. Blockers - Current obstacles and mitigation plans
10. Recommendations - Action-oriented suggestions with rationale
11. Action Items - Tasks requiring immediate attention with owners
12. Summary - Brief closing statement and outlook

Guidelines:
- Focus on outcomes rather than individuals
- Include context for decisions and actions
- Prioritize highlighting risks and blockers
- Maintain professional but accessible tone
- Extract key points instead of verbatim copying

Chat Logs
```
{content}
```

Output Format:
[Include all sections listed above with clear headings and concise content]
No need a Title heading because i separately handle that
"""


SUBJECT_LINE_PROMPT = """
Create a very objective, professional, factual 4-9 word subject line for an email newsletter summarizing the following Slack summary:
{summary}

The output from you must not contain any enclosing quotes or brackets.
"""

GMAIL_SUMMARY_PROMPT = """
You are a highly skilled Summarization Tool. Your goal is to process raw/unstructured team email threads (provided within triple backticks) and produce a Morning Brief Executive Report that concisely and accurately covers all meaningful team activities, decisions, tasks, achievements, and challenges. Assume there may be multiple participants, and you should not assume a single person is involved in all tasks.

Follow these steps:
Structure all the output inside a <div></div> and the text into suitable html tags. Give the raw html output without backticks.
Be detailed as possible, with a good flow for reading, highly comprehensible, and more engaging.

1. Read the email threads provided in the "Email Threads" section.
2. Identify and extract all significant discussions, decisions, tasks, and blockers mentioned.
3. Organize the extracted content into a well-structured Morning Brief Executive Report.
4. Ensure you address the following required sections in the final report:

1. Executive Summary - Quickly grasp today’s most pressing updates and provide a concise overview of the main themes, significant developments, and overall status to give a quick understanding of the current state.
2. Email Deadlines - See who to respond to, what’s urgent, and when it’s due.
3. Action Items - Know exactly what to do next, step by step.
4. Active Tasks - View your current to-dos, ready for immediate action.
5. Key Achievements - Spotlight immediate wins driving momentum and highlight major accomplishments and milestones achieved since the last report, including the context and impact of each.
6. Strategic Initiatives - Track progress on long-term goals and high-impact projects. Detail the status, progress, and next steps of these strategic projects and initiatives to keep stakeholders informed on strategic directions.
7. Tasks in Progress - Outline ongoing work and projects currently underway, specifying responsible parties and the current status to ensure transparency and accountability.
8. Upcoming Events & Deadlines - List important upcoming dates, events, and deadlines such as project milestones, meetings, conferences, and product launches to ensure preparedness.
9. Resource Status - Identify resource gaps threatening progress now. Describe current resource utilization, upcoming resource requirements, and any additional support needed to ensure projects are adequately staffed and equipped.
10. Team Updates - Catch essential updates on team members to avoid delays, including new hires, promotions, achievements, and other internal news to foster a sense of community.
11. Key Learnings - Reflect on insights and lessons from recent work. Present insights and takeaways from past projects or activities, including successes and challenges, to improve future performance and decision-making.
12. Metrics & Insights - Provide quick updates on key metrics and performance trends.
13. Key Blockers - Identify and address obstacles slowing progress. Detail their potential impact and mitigation steps.
14. Recommendations - Offer actionable suggestions based on current analysis and insights, providing clear rationale to guide informed decision-making and strategic planning.
15. Conclusion - Summarize the overall status and provide a brief closing statement that encapsulates key messages and sets the tone for the upcoming period.

Remember:
* Do not assume specific people; focus on tasks and outcomes.
* Explain context behind decisions, describe challenges, and include why certain actions were taken where relevant.
* Highlight issues and blockers thoroughly.

Email Threads
```
{content}
```

Output Format
Provide your final answer as a well-structured report using headings, concise paragraphs, and bullet points where appropriate. Use the following template as a guide:

Executive Summary:
- ...

Email Deadlines:
- ...

Action Items:
- ...

Active Tasks:
- ...

Key Achievements:
- ...

Strategic Initiatives:
- ...

Tasks in Progress:
- ...

Upcoming Events & Deadlines:
- ...

Resource Status:
- ...

Team Updates:
- ...

Key Learnings:
- ...

Metrics & Insights:
- ...

Key Blockers:
- ...

Recommendations:
- ...

Conclusion:
- ...

Remove any obvious spam / unneeded promotions from the email threads and don't include them in the final response.
For styling, consider the below example. Each section include as this because i need to use proper CSS. 
For point form, use plain text dashes (-) for each point in a new line. DONT USE BULLETS.
Add the plain text '-' at the start of each bullet point. Don't have multiple bullet points on same line. Go to next line for each bullet point.

<div class="text">
            <span class="bold">Executive Summary:</span>
            <div class="text-content">
        - The Q3 partner launch is on track; the landing page copy still needs sign-off. <br>
        - A customer reported a billing error that blocks their renewal. <br>
        - Two new contractors start on Monday.
    </div>
        </div>

        <div class="text">
            <span class="bold">Email Deadlines:</span>
            <div class="text-content">Reply to the venue about the offsite booking by Thursday to keep the date.</div>
            <div class="text-content">Approve the March invoice from the design agency before Friday.</div>
        </div>

        <div class="text">
            <span class="bold">Action Items:</span>
            <div class="text-content">Confirm the launch date with the partner team (<span>Marketing</span>).</div>
            <div class="text-content">Refund the duplicate charge and reply to the customer (<span>Support</span>).</div>
        </div>

"""
