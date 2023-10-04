import { signIn } from 'next-auth/react';
import styles from '../styles/Home.module.css';
import github from '../assets/GitHub.jpeg';
import twitter from '../assets/Twitter.png';
import google from '../assets/Google.png';
import Image from 'next/image';

export default function AccessDenied () {
  return (
    <div className={styles.accessDenied}>
      <h1 className={styles.welcomeMsg}>WELCOME TO TRACKCHAT</h1>
      <div>
        <a href="/api/auth/signin"
           className={styles.clickHere}
           onClick={(e) => {
           e.preventDefault()
           signIn()
        }}>
          <Image className={styles.logInImg} alt={"google"} src={google} width={300}/>
          <br/>
          <Image className={styles.logInImg} alt={"twitter"} src={twitter} width={300}/>
          <br/>
          <Image className={styles.logInImg} alt={"github"} src={github} width={300}/>
        </a>
      </div>
    </div>
  )
}