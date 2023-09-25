import { signIn } from 'next-auth/react';
import styles from '../styles/Home.module.css';

export default function AccessDenied () {
  return (
    <div className={styles.accessDenied}>
      <h1>Welcome to Ably Realtime Chat & Collaboration App</h1>
      <h2>Access Denied</h2>
      <p>
        <a href="/api/auth/signin"
           className={styles.clickHere}
           onClick={(e) => {
           e.preventDefault()
           signIn()
        }}><h3 >👉 Click Here to Sign-in 👈</h3></a>
      </p>
    </div>
  )
}