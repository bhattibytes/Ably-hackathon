import { signIn } from 'next-auth/react';
import styles from '../styles/Home.module.css';

export default function AccessDenied () {
  return (
    <div className={styles.accessDenied}>
      <h1>Welcome to Ably Realtime Chat & Collaboration App</h1>
      <div>
        <a href="/api/auth/signin"
           className={styles.clickHere}
           onClick={(e) => {
           e.preventDefault()
           signIn()
        }}><h3 >👉 Click Here to Connect with Google 👈</h3></a>
      </div>
    </div>
  )
}