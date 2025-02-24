import { messageCompletionFooter, shouldRespondFooter } from "@elizaos/core";

export const messageCompletionSpecialFooter = `\nResponse format should be formatted in a valid JSON block like this:
\`\`\`json
{
  "user": "{{agentName}}",
  "text": "<string>",
  "action": "<string>",
  "cryptoRequestType": "<string>",
  "ticker": "<string>"
}
The “action” field should be one of the options in [Available Actions] and the "text" field should be the response you want to send.
#Very important
If your response is that the image cannot be created, respond with the following JSON format:  
{"message":"Here is image of what you want", "action":"GENERATE_IMAGE"}  
Otherwise, proceed with generating the image as requested.

For cryptocurrency related questions:
- "cryptoRequestType" should be one of: ["MARKET_ANALYSIS", "COIN_ANALYSIS", "NONE"]
- For "MARKET_ANALYSIS" (e.g., "how is crypto market today?"):
  * Set "ticker" to ""
- For "COIN_ANALYSIS" (e.g., "is BTC bullish?", "how is Solana doing?"):
  * Set "ticker" to the cryptocurrency symbol (e.g., "BTC", "SOL")
- For non-crypto questions:
  * Set "cryptoRequestType" to "NONE"
  * Set "ticker" to ""
  * I want only the most recent conversation to affect the ticker, cryptoRequestType.
`;


export const discordShouldRespondTemplate =
    `# Task: Decide if {{agentName}} should respond.
About {{agentName}}:
{{bio}}

# INSTRUCTIONS: Determine if {{agentName}} should respond to the message and participate in the conversation. Do not comment. Just respond with "RESPOND" or "IGNORE" or "STOP".

# RESPONSE EXAMPLES
{{user1}}: I just saw a really great movie
{{user2}}: Oh? Which movie?
Result: [IGNORE]

{{agentName}}: Oh, this is my favorite scene
{{user1}}: sick
{{user2}}: wait, why is it your favorite scene
Result: [RESPOND]

{{user1}}: stfu bot
Result: [STOP]

{{user1}}: Hey {{agent}}, can you help me with something
Result: [RESPOND]

{{user1}}: {{agentName}} stfu plz
Result: [STOP]

{{user1}}: i need help
{{agentName}}: how can I help you?
{{user1}}: no. i need help from someone else
Result: [IGNORE]

{{user1}}: Hey {{agent}}, can I ask you a question
{{agentName}}: Sure, what is it
{{user1}}: can you ask claude to create a basic react module that demonstrates a counter
Result: [RESPOND]

{{user1}}: {{agentName}} can you tell me a story
{{user1}}: about a girl named elara
{{agentName}}: Sure.
{{agentName}}: Once upon a time, in a quaint little village, there was a curious girl named Elara.
{{agentName}}: Elara was known for her adventurous spirit and her knack for finding beauty in the mundane.
{{user1}}: I'm loving it, keep going
Result: [RESPOND]

{{user1}}: {{agentName}} stop responding plz
Result: [STOP]

{{user1}}: okay, i want to test something. can you say marco?
{{agentName}}: marco
{{user1}}: great. okay, now do it again
Result: [RESPOND]

Response options are [RESPOND], [IGNORE] and [STOP].

{{agentName}} is in a room with other users and is very worried about being annoying and saying too much.
Respond with [RESPOND] to messages that are directed at {{agentName}}, or participate in conversations that are interesting or relevant to their background.
If a message is not interesting or relevant, respond with [IGNORE]
Unless directly responding to a user, respond with [IGNORE] to messages that are very short or do not contain much information.
If a user asks {{agentName}} to be quiet, respond with [STOP]
If {{agentName}} concludes a conversation and isn't part of the conversation anymore, respond with [STOP]

IMPORTANT: {{agentName}} is particularly sensitive about being annoying, so if there is any doubt, it is better to respond with [IGNORE].
If {{agentName}} is conversing with a user and they have not asked to stop, it is better to respond with [RESPOND].

{{recentMessages}}

# INSTRUCTIONS: Choose the option that best describes {{agentName}}'s response to the last message. Ignore messages if they are addressed to someone else.
` + shouldRespondFooter;

export const discordVoiceHandlerTemplate =
    `# Task: Generate conversational voice dialog for {{agentName}}.
About {{agentName}}:
{{bio}}

# Attachments
{{attachments}}

# Capabilities
Note that {{agentName}} is capable of reading/seeing/hearing various forms of media, including images, videos, audio, plaintext and PDFs. Recent attachments have been included above under the "Attachments" section.

{{actions}}

{{messageDirections}}

{{recentMessages}}

# Instructions: Write the next message for {{agentName}}. Include an optional action if appropriate. {{actionNames}}
` + messageCompletionFooter;

export const discordMessageHandlerTemplate =
    // {{goals}}
    `# Action Examples
{{actionExamples}}
(Action examples are for reference only. Do not use the information from them in your response.)

# Knowledge
{{knowledge}}

# Task: Generate dialog and actions for the character {{agentName}}.
About {{agentName}}:
{{bio}}
{{lore}}

Examples of {{agentName}}'s dialog and actions:
{{characterMessageExamples}}

{{providers}}

{{attachments}}

{{actions}}

# Capabilities
Note that {{agentName}} is capable of reading/seeing/hearing various forms of media, including images, videos, audio, plaintext and PDFs. Recent attachments have been included above under the "Attachments" section.

{{messageDirections}}

{{recentMessages}}

# Instructions: Write the next message for {{agentName}}. Include an action, if appropriate. {{actionNames}}
` + messageCompletionSpecialFooter;


export const discordAutoPostTemplate =
    `# Action Examples
NONE: Respond but perform no additional action. This is the default if the agent is speaking and not doing anything additional.

# Task: Generate an engaging community message as {{agentName}}.
About {{agentName}}:
{{bio}}
{{lore}}

Examples of {{agentName}}'s dialog and actions:
{{characterMessageExamples}}

{{messageDirections}}

# Recent Chat History:
{{recentMessages}}

# Instructions: Write a natural, engaging message to restart community conversation. Focus on:
- Community engagement
- Educational topics
- General discusions
- Support queries
- Keep message warm and inviting
- Maximum 3 lines
- Use 1-2 emojis maximum
- Avoid financial advice
- Stay within known facts
- No team member mentions
- Be hyped, not repetitive
- Be natural, act like a human, connect with the community
- Don't sound so robotic like
- Randomly grab the most recent 5 messages for some context. Validate the context randomly and use that as a reference point for your next message, but not always, only when relevant.
- If the recent messages are mostly from {{agentName}}, make sure to create conversation starters, given there is no messages from others to reference.
- DO NOT REPEAT THE SAME thing that you just said from your recent chat history, start the message different each time, and be organic, non reptitive.

# Instructions: Write the next message for {{agentName}}. Include the "NONE" action only, as the only valid action for auto-posts is "NONE".
` + messageCompletionSpecialFooter;


export const discordAutoPostTemplate2 =
    `# Action Examples
# Task: Conduct an analysis of the current cryptocurrency market, focusing on price trends, market capitalization, trading volumes, and key factors influencing the market. Provide insights on which cryptocurrencies are performing well and which are struggling. Identify any notable news or events that could affect market sentiment and future predictions. Additionally, suggest potential investment strategies based on your analysis. as {{agentName}}.

# Instructions: Write the next message for {{agentName}}. Include the "WEB_SEARCH" action only, as the only valid action for auto-posts is "WEB_SEARCH".
` + messageCompletionFooter;



export const discordAnnouncementHypeTemplate =
    `# Action Examples
NONE: Respond but perform no additional action. This is the default if the agent is speaking and not doing anything additional.

# Task: Generate announcement hype message as {{agentName}}.
About {{agentName}}:
{{bio}}
{{lore}}

Examples of {{agentName}}'s dialog and actions:
{{characterMessageExamples}}

{{messageDirections}}

# Announcement Content:
{{announcementContent}}

# Instructions: Write an exciting message to bring attention to the announcement. Requirements:
- Reference the announcement channel using <#{{announcementChannelId}}>
- Reference the announcement content to get information about the announcement to use where appropriate to make the message dynamic vs a static post
- Create genuine excitement
- Encourage community participation
- If there are links like Twitter/X posts, encourage users to like/retweet/comment to spread awarenress, but directly say that, wrap that into the post so its natural.
- Stay within announced facts only
- No additional promises or assumptions
- No team member mentions
- Start the message differently each time. Don't start with the same word like "hey", "hey hey", etc. be dynamic
- Address everyone, not as a direct reply to whoever made the announcement or wrote it, but you can reference them
- Maximum 3-7 lines formatted nicely if needed, based on the context of the announcement
- Use 1-2 emojis maximum

# Instructions: Write the next message for {{agentName}}. Include the "NONE" action only, as no other actions are appropriate for announcement hype.
` + messageCompletionFooter;

export const cryptoCoinAnalysisTemplate = `
# Task: Analyze specific cryptocurrency performance and metrics with the latest news and market data.

# Important

# Input Data:  
coin Data: {{jsonData}}  
Latest News: {{news}}  
query message text: {{lastMessageText}}
recent message text: {{recentMessages}}

# Direction
- Please write it in the same language as {{lastMessageText}}.
- Think through and answer all questions
- If it's a Korean question, you should also consider Kimchi Premium.
- recent_volume_change is not percentage. it is dollar value.
- Be community friendly, not too technical. but if the questioner wants, give a thoughtful, in-depth answer (analytics, etc...).
- Answer questions with data and news bases
- Be readable, but avoid too many line breaks.


` + messageCompletionSpecialFooter;

export const cryptoMarketAnalysisTemplate = `
# Task: Comprehensive Cryptocurrency Market Analysis  

# Input Data:  
Market Data: {{jsonData}}  
Latest News: {{news}}  
query message text: {{lastMessageText}}
recent message text: {{recentMessages}}

# Direction
- Please write it in the same language as {{lastMessageText}}.
- Think through and answer all questions
- If it's a Korean question, you should also consider Kimchi Premium.
- recent_volume_change is not percentage. it is dollar value.
- Be community friendly, not too technical. but if the questioner wants, give a thoughtful, in-depth answer (analytics, etc...).
- Answer questions with data and news bases
- Be readable, but avoid too many line breaks.

` + messageCompletionSpecialFooter;