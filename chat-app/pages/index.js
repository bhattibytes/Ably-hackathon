import Head from 'next/head'
import dynamic from 'next/dynamic'
import Footer from '../components/Footer.js';
// import { AblyProvider } from '@ably-labs/react-hooks';

const AblyChatComponent = dynamic(() => import('../components/AblyChatComponent'), { ssr: false });

export default function Home() {
  return (
    <div className="container">
      <Head>
        <title>Ably Chat App</title>
        <link rel="icon" href="https://static.ably.dev/motif-red.svg?nextjs-vercel" type="image/svg+xml" />
      </Head>

      <main>
        <center><h1 className="title">Ably Chat App</h1></center>
        {/* <AblyProvider options={{ authUrl: "/api/createTokenRequest" }}> */}
          <AblyChatComponent />
        {/* </AblyProvider> */}
      </main>

      <Footer />
      
      <style jsx>{`
        ...       
      `}</style>

      <style jsx global>{`
        ...        
      `}</style>
    </div>
  )
}