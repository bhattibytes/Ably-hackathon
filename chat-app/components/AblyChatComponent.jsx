import React, { useEffect, useState } from 'react';
import { useChannel } from "./AblyReactEffect.js";
import styles from '../styles/AblyChatComponent.module.css';
import { Editor } from '@tinymce/tinymce-react';
import parse from 'html-react-parser';

const AblyChatComponent = () => {
  let messageEnd = null;

  const [messageText, setMessageText] = useState("");
  const [receivedMessages, setMessages] = useState([]);

  const [channel, ably] = useChannel("chat-app", (message) => {
    const history = receivedMessages.slice(-199);
    setMessages([...history, message]);
  });

  const sendChatMessage = (messageText) => {
    channel.publish({ name: "chat-message", data: messageText });
  }
  
  const handleFormSubmission = (event) => {
    if (messageText === '') {
      alert("Please enter a message")
    } else { 
    event.preventDefault();
    sendChatMessage(messageText);
    let form = document.querySelector('form');
    form.reset();
    }
  }

  const messages = receivedMessages.map((message, index) => {
    const author = message.connectionId === ably.connection.id ? "me" : "other";
    let parsedMessage;
    try {
      parsedMessage = parse(message.data);
    } catch (error) {
      console.log(error);
      parsedMessage = message.data;
    }
    return <span key={index} className={styles.message} data-author={author}>{parsedMessage}</span>;
  });

  useEffect(() => {
    messageEnd.scrollIntoView({ behaviour: "smooth" });
  });

  return (
    <center>
      <div className={styles.chatHolder}>
        <div className={styles.chatText}>
          {messages}
          <div ref={(element) => { messageEnd = element; }}></div> 
        </div>
        <form onSubmit={handleFormSubmission} className={styles.form}>
          <Editor
            apiKey='rhs24uxaf33ilb57ay29q85ihp0re5mside0imo026cg3lt0'
            init={{
              height: 150,
              placeholder: "Type your message here...",
              menubar: false,
              plugins: [
                'advlist autolink lists link image charmap print preview anchor',
                'searchreplace visualblocks code fullscreen',
                'emoticons',
                'insertdatetime media table paste code help wordcount'
              ],
              toolbar:
                'undo redo | formatselect | bold italic backcolor | \
                removeformat | emoticons'
            }}
            onEditorChange={(content, editor) => setMessageText(content)}
          />
          <button type="submit" className={styles.button}>Send</button>
        </form>
      </div>
    </center>
  )
}

export default AblyChatComponent;