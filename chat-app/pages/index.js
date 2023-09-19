import Head from 'next/head'
import dynamic from 'next/dynamic'
import Footer from '../components/Footer.js';

const AblyChatComponent = dynamic(() => import('../components/AblyChatComponent'), { ssr: false });

export default function Home() {
  return (
    <div>
      <Head>
        <title>Ably Chat App</title>
        <link rel="icon" href="https://static.ably.dev/motif-red.svg?nextjs-vercel" type="image/svg+xml" />
      </Head>
      
      <main>
        <center><h1>Ghost Chat App</h1></center>
        <AblyChatComponent />
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