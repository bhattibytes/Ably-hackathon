import styles from '../styles/Home.module.css';

const Footer = () => {
  return (
    <div className={styles.container}>
      <footer className={styles.footer}>
        <div className='flex items-center text-lg font-medium py-9'>
        Powered by

        <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">
          <img src="/vercel.svg" alt="Vercel Logo" className={styles.logo} id={'vercel'}/>
        </a>
        with
        <a href="https://ably.com" rel="noopener noreferrer">
          <img src="/ably-logo.svg" alt="Ably Logo" className={styles.logo} id={'ably'}/>
        </a>
        &amp; 
        <a href="https://www.tiny.cloud/powered-by-tiny" rel="noopener noreferrer">
          <img src="https://www.tiny.cloud/docs/images/logos/android-chrome-256x256.png" alt="Ting Logo" className={styles.logo} id={'tiny'} />
        </a>
        </div>
        
    </footer>
  </div>
  );
};

export default Footer;