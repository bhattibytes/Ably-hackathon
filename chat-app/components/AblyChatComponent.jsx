import React, { useEffect, useState } from 'react';
import { useChannel } from "./AblyReactEffect.js";
import styles from '../styles/AblyChatComponent.module.css';
import { Editor } from '@tinymce/tinymce-react';
import parse from 'html-react-parser';
import { useSession } from 'next-auth/react';

const dynamodb = new AWS.DynamoDB({ convertEmptyValues: true });

const AblyChatComponent = () => {
  let messageEnd = null;

  const [messageText, setMessageText] = useState("");
  const [value, setValue] = useState("");
  const [channelName, setChannelName] = useState("home");
  const [channels, setChannels] = useState(["home", "general", "random", "help"]);
  const { data: session, status } = useSession();
  const [messagesFromDB, setMessagesFromDB] = useState([]);

  async function queryWithPartiQL() {
    const statement = 'SELECT * FROM "ably_users"';
    return await dynamodb.executeStatement({Statement: statement}).promise().then((data) => {
      if (data.Items.length) {
        setMessagesFromDB(data.Items);
      }
    }).catch((error) => {
      console.log('error: ', error);  
    });;
  }

  const [channel, ably] = useChannel(channelName, async (message) => {
    let messagesFromDBCall = [];
    setTimeout(async() => { messagesFromDBCall = await queryWithPartiQL(); }, 50);
    setTimeout(() => { 
      
        setMessagesFromDB((messagesFromDB)=> {
          if (Array.isArray(messagesFromDB) && Array.isArray(messagesFromDBCall)) {
            return [...messagesFromDB, ...messagesFromDBCall, message]; 
          }
        });
     }, 500);
  });

  useEffect(() => {
    setMessagesFromDB(queryWithPartiQL());
  }, []);

  var parsedMessages = [];
  if (messagesFromDB.length && session && status === 'authenticated') {
      var sorted = messagesFromDB.sort((a, b) => new Date(a.timestamp.S).getTime() - new Date(b.timestamp.S).getTime() );
      sorted = sorted.filter((message) => message.channel ? message.channel.S === channelName : null );
      
      parsedMessages = sorted.map((message, index) => {
        let parsedMessage;
        const author = message.author.S
        try {
          parsedMessage = parse(message.message.S);
        } catch (error) {
          console.log(error);
          parsedMessage = message.message.S;
        } 
        return (
          <span key={index} className={styles.messages}>
            { session.user.email === message.email.S ? 
              <>
                <img height={40} className={styles.messageImgMe} src={message.image.S}/>   
                <span className={styles.messageMe} data-author={author}>
                  <span className={styles.authorMe}>{author}<br/></span>{parsedMessage}
                </span>     
              </>
              :
              <>
                <span className={styles.message} data-author={author}> 
                  <span id="other" className={styles.author}>{author}<br/></span>{parsedMessage}
                </span>
                <img height={40} className={styles.messageImg} src={message.image.S}/>
              </>
            }
          </span>
          )
      });
  }

  const form = document.querySelector('form#chat-form');
  const input = document.querySelector('input#create-channel');

  const sendChatMessage = async (messageText) => {
    if (messageText !== '') {
      await channel.publish({ 
        name: channelName, 
        data: `<strong>${messageText.slice(3, -4) + '</strong> <em>at</em> ' + '<em>'+ new Date().toLocaleString().split(',')[1]}</em>` 
      });
      setTimeout(() => { setMessagesFromDB(queryWithPartiQL()); }, 50);
    }
  }
  
  const handleFormSubmission = (event) => {
    event.preventDefault();
    if (messageText === '') {
      alert("Please enter a message")
    } else { 
      sendChatMessage(messageText);
      form.reset();
    }
  }

  const createChannel = () => {
    if (value === '') {
      alert("Please enter a channel name")
    } else if (channels.includes(value)) {
      alert("This channel already exists")
      setValue("");
    } else {
      setChannelName(value);
      const newChannel = ably.channels.get(value);
      newChannel.attach();
      newChannel.publish({ 
        name: value, 
        data: `A New Channel named <strong>"${value}"</strong> was created <em> at ${new Date().toLocaleString().split(',')[1]}</em>` 
      });
      newChannel.once("attached", () => {
        newChannel.history((err, page) => {
          const messages = page.items.reverse();
          setMessagesFromDB([...messages]);
          setChannels((channels)=>[...channels, value]);
        });
        setTimeout(() => { setMessagesFromDB(queryWithPartiQL()); }, 50);
        setValue("");
      });
    }
  }

  const switchChannel = (e) => {
    e.preventDefault();
    const newChannelName = e.target.innerText.slice(2);
    if (newChannelName === "#" || newChannelName === "") {
      return;
    }
    setChannelName(newChannelName);
    if (newChannelName === channelName) {
      alert("You are already in this channel")
      return;
    } else {
    const newChannel = ably.channels.get(newChannelName);
    newChannel.attach();
    newChannel.publish({ 
      name: newChannelName, 
      data: `Switched to channel: <strong>"${newChannelName}"</strong> at ${new Date().toLocaleString().split(',')[1]}` 
    });
      newChannel.history((err, page) => {
        let messages = page.items.reverse();
        setMessagesFromDB((messagesFromDB)=>[...messagesFromDB, ...messages]);
      });
    }
  }

  useEffect(() => {
    messageEnd.scrollIntoView({ behaviour: "smooth" });
  });

  return (
    <>
      <h1 className={styles.channels}>
      <span className={styles.channelTitle}>CHANNELS</span>
      {channels.map((channel, index) => 
      <span key={index}>
        <p className={styles.channelListItems} onClick={(e) => switchChannel(e)}>
        <span key={index} className={styles.hashTag}>#</span>
          {channel}
        </p>
      </span>
      )}
      </h1>
      <center className={styles.chatCenter}>
        <h1>"{channelName}"</h1>
        <div className={styles.createChannel}>
          <input 
          className={styles.createChannelInput}
          id="create-channel" 
          type="text" 
          placeholder="Enter Channel Name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key == "Enter") {
              e.preventDefault();
              createChannel();
              setValue("");
            }
          }}
          />
          <button className={styles.newChannelButton} onClick={createChannel}>Create New Channel</button>
        </div>
        <div className={styles.chatHolder}>
          <div className={styles.chatText}>
            {parsedMessages}
            <div ref={(element) => { messageEnd = element; }}></div> 
          </div>
          <form
          id="chat-form" 
          onSubmit={handleFormSubmission} 
          className={styles.form}
          >
            <Editor
              apiKey={process.env.TINY_MCE_API_KEY}
              onKeyDown={(e) => {
                if (e.key == "Enter") {
                  e.preventDefault();
                  sendChatMessage(messageText);
                  form.reset();
                }
              }}
              init={{
                height: 180,
                placeholder: "Type your message here...",
                menubar: false,
                plugins: [
                  'emoticons',
                  'insertdatetime',
                  'link',
                  'lists',
                  'table',
                  'image',
                  'code'
                ],
                toolbar:
                  'undo redo | formatselect | bold italic backcolor | \
                  emoticons | link | code |  removeformat \ '
              }}
              onEditorChange={(content, editor) => setMessageText(content)}
            />
            <button type="submit" className={styles.button}>Send</button>
          </form>
        </div>
      </center>
    </>
  )
}

export default AblyChatComponent;