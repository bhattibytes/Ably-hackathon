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
      <div className={styles.authProviders}>
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
        <img className={styles.coverImg2} src={'https://images2.imgbox.com/9b/20/aEhBSWpJ_o.png'} width={600}/>
        <img className={styles.coverImg1} src={'https://images2.imgbox.com/d6/99/YXaCmfHq_o.png'} width={1000}/>
    </div>
  )
}