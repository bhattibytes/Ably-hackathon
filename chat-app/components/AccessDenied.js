import { signIn } from 'next-auth/react';
import styles from '../styles/Home.module.css';
import github from '../assets/GitHub.jpeg';
import twitter from '../assets/Twitter.png';
import google from '../assets/Google.png';
import chat from '../assets/chat.png';
import project from '../assets/project.png';
import Image from 'next/image';

export default function AccessDenied () {
  return (
    <div className={styles.accessDenied}>
      <h1 className="text-track-blue">WELCOME TO TRACKCHAT</h1>
      <div className={styles.authProviders}>
        <a href="/api/auth/signin"
           className={styles.clickHere}
           onClick={(e) => {
           e.preventDefault()
           signIn()
        }}>
          <Image className={styles.logInImg} alt={"google"} src={google} width={350}/>
          <br/>
          <Image className={styles.logInImg} alt={"twitter"} src={twitter} width={350}/>
          <br/>
          <Image className={styles.logInImg} alt={"github"} src={github} width={350}/>
        </a>
      </div>
        <Image className="absolute top-32" src={chat} width={650}/>
        <Image className="absolute right-5 top-20" src={project} width={700}/>
    </div>
  )
}