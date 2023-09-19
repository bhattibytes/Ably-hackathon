import styles from '../styles/Home.module.css';

const Footer = () => {
  return (
    <center className={styles.container}>
      <footer className={styles.footer}>
         Powered by
        <br/>
        <br/>
        <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">
          <img src="/vercel.svg" alt="Vercel Logo" className={styles.logo} height={20} />
        </a>
        with
        <a href="https://ably.com" rel="noopener noreferrer">
          <img src="/ably-logo.svg" alt="Ably Logo" className={styles.logo} height={42} />
        </a>
        and 
        <a href="https://www.tiny.cloud/powered-by-tiny" rel="noopener noreferrer">
          <img src="https://www.tiny.cloud/docs/images/logos/android-chrome-256x256.png" alt="Ting Logo" className={styles.logo} height={32} />
        </a>
    </footer>
  </center>
  );
};

export default Footer;