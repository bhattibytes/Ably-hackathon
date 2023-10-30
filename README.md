# Ably Chat Collaboration App

This is a chat collaboration application built as part of the Ably Hackathon contest. The application is built using [Next.js](https://nextjs.org/) and [Ably](https://ably.com/).

## Features

- Real-time chat
- Private chats
- Collaboration features
- Rich text messaging
- Secure

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Ably Hackathon Contest

For more details about the Ably Hackathon contest, please visit [Ably Hackathon Rules](https://ably.devpost.com/rules).

## Ably Hackathon Submission - Retrospective


## Inspiration
TrackChat was born out of a desire to address the communication challenges faced by development teams when working on project roadmaps. It facilitates seamless interaction among development teams and enables them to create and manage multiple project roadmaps effortlessly. This innovative collaboration tool seamlessly integrates a Slack-like chat interface to support both one-on-one conversations and group discussions, enhancing team collaboration and project coordination.

## What it does
TrackChat provides a unified platform where users can engage in real-time conversations with team members and access a dynamic project management dashboard simultaneously. This versatile app combines social interaction with efficient project oversight, fostering collaboration and boosting productivity for development teams.

## How we built it
The app's development journey began with the integration of key tools and technologies. The initial build leveraged the Ably SDK, AWS SDK, and NextAuth for essential functionalities. Additionally, the ReactDND Kanban board was implemented to streamline the project management workflow.

Subsequently, Mr. Labhk Khatke took charge of enhancing the app's collaborative features on the kanban board. He introduced live cursors and implemented a locking mechanism to ensure that only one user could make changes to the board at any given time.

Meanwhile, I focused on refining the chat interface to provide a rich text editing experience. Other features I built were the ability to create new channels, engage in private messaging, react to messages, and reply to specific messages. In addition, I established a connection with DynamoDB to securely store all chat messages and maintain the positions of items on the Kanban board. Together, these efforts contributed to the development of a comprehensive and feature-rich app.
 
## Challenges we ran into
We encountered notable challenges during the development process. My primary hurdle arose when transitioning to save messages in DynamoDB and ensuring their real-time updates. Initially, pulling messages from the Ably channel history worked seamlessly. However, due to cost considerations, we opted against using AWS Lambdas to trigger specific code for fetching new messages. Instead, I employed strategically placed setTimeouts to address this issue to a significant extent. It's a matter I intend to address more comprehensively in the future.

Labhk faced his own set of challenges, primarily related to implementing live cursors. While these presented some difficulties, his resourcefulness and creative use of CSS ultimately allowed him to overcome these obstacles.

## Accomplishments that we're proud of
We take immense pride in our accomplishments, achieved within a remarkably short timeframe through effective collaboration. This journey has been a profound learning experience for me, particularly in mastering DynamoDB and navigating the complexities of real-time data flows. It has also shed light on areas within the development process that require further refinement.

In retrospect, this endeavor served as an incredible opportunity for self-directed learning in coding, underlining the significance of hands-on experience and problem-solving in becoming a more proficient developer.

## What we learned
Throughout this journey, I gained valuable insights into my role as a developer, identifying my strengths and areas that warrant improvement. One crucial lesson was mastering the art of selecting the most suitable technology and adapting when things deviate from the initial plan.

Furthermore, I deepened my understanding of project management as a holistic discipline. I honed my skills in structuring a development roadmap for timely project completion. Exploring new technologies during this project expanded my knowledge of general syntax and programming practices, making me more versatile as a developer.

In the process, I discovered the art of asking insightful questions. This entire experience has been a fantastic learning opportunity that I aspire to carry forward, perhaps by participating in another hackathon.

## What's next for Ably - TrackChat
Looking ahead to the future of Ably - TrackChat, our focus is on enhancing its real-time capabilities and overall functionality. We have plans to integrate Tanstack Query to further address real-time challenges and are committed to refining the app's design for a more user-friendly experience.

Our ultimate goal is to continue the development of TrackChat, aiming to elevate it to a true production-level application that can serve a broad user base. We are dedicated to ongoing improvements and ensuring that the app becomes a valuable resource for all.
