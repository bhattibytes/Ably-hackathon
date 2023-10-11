import React, { useEffect, useState } from 'react';
import { useChannel } from "./AblyReactEffect.js";
import styles from '../styles/AblyChatComponent.module.css';
import { Editor } from '@tinymce/tinymce-react';
import parse from 'html-react-parser';
import { useSession } from 'next-auth/react';
import { v4 as uuidv4 } from 'uuid';

const dynamodb = new AWS.DynamoDB({ convertEmptyValues: true });

const AblyChatComponent = () => {
  let messageEnd = null;

  const [messageText, setMessageText] = useState("");
  const [value, setValue] = useState("");
  const [channelName, setChannelName] = useState("home");
  const [channels, setChannels] = useState(["home", "charla", "general", "random", "help", "dev"]);
  const [privateChannels, setPrivateChannels] = useState([]);
  const { data: session, status } = useSession();
  const [messagesFromDB, setMessagesFromDB] = useState([]);
  const [members, setMembers] = useState([]);
  const [membersTyping, setMembersTyping] = useState([]);

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

  async function queryChannelsWithPartiQL() {
    const statement = 'SELECT * FROM "ably_channels"';
    return await dynamodb.executeStatement({Statement: statement}).promise().then((data) => {
      if (data.Items.length) {
        let channelsFromDB = [];
        data.Items.forEach((item) => {
          if (item.channelOwner.S === session.user.email) {
            channelsFromDB.push(item.channelName.S);
          }
        });
        setPrivateChannels([...channelsFromDB]);
      }
    }).catch((error) => {
      console.log('error: ', error);  
    });;
  }

  const [channel, realtime] = useChannel(channelName, async (message) => {
    let messagesFromDBCall = [];
    setTimeout(async() => { messagesFromDBCall = await queryWithPartiQL(); }, 10);
    return new Promise((resolve, reject) => {
      resolve(messagesFromDBCall);
    }).catch((error) => {
      console.log('error: ', error);  
      reject(error);
    }).then (() => {
      setMessagesFromDB((messagesFromDB)=> [...messagesFromDB, ...messagesFromDBCall]);
      });
    }
  );

  const saveChannelToDB = async (channelName) => {
    if (privateChannels.includes(channelName)) {
      alert("This channel already exists")
      return;
    }
    dynamodb.putItem({
      TableName: 'ably_channels',
      Item: {
        'id': { S: uuidv4() },
        'channelOwner': {S: session.user.email},
        'ownerName': { S: session.user.name },
        'channelName': { S: channelName },
        'timestamp': { S: new Date().toISOString() },
        'connectionId': { S: realtime.connection.id },
        'channelMembers': { SS: [session.user.name] },
      }
    }, function(err, data) {
      if (err) {
        console.log('Error', err);
      } else {
        console.log('Success MSG: ', data);
        queryChannelsWithPartiQL();
      }
    });
  };

  const typingIndicator = (content) => {
    if (content !== '') {
      channel.presence.enterClient('ably-nextjs-chat', 
      {email: session.user.email, image: session.user.image, author: session.user.name, isTyping: true}, 
      function(err) {   
        if (err) {
          console.log('error: ', err);  
        }
      });
      channel.presence.get(function(err, members) {
        if (err) {
          console.log('error: ', err);  
        } else {
          setMembersTyping(members.map((member) => member.data));
        }
      });
      channel.presence.subscribe('enter', function(member) {
        setMembers((members)=> {
          members.push(member.data.image);
          members = Array.from(new Set(members));
          return [...members]
        });
      })
    } else {
      channel.presence.leaveClient('ably-nextjs-chat', 
      {email: session.user.email, image: session.user.image, author: session.user.name, isTyping: false}, 
      function(err) {   
        if (err) {
          console.log('error: ', err);  
        }
      });
    }
  }

  const getPresenceTyping = (content) => {
    if (content !== '') {
    channel.presence.get(function(err, members) {
      if (err) {
        console.log('error: ', err);  
      } else {
        setMembersTyping(members.filter((member) => member.data.isTyping).map((member) => member.data.author));
      }
    });
    } else {
      channel.presence.leaveClient('ably-nextjs-chat', {email: session.user.email, image: session.user.image, author: session.user.name, isTyping: false}, function(err) {   
        if (err) {
          console.log('error: ', err);  
        }
      });
    }
  }
  useEffect(() => {
    channel.presence.enterClient('ably-nextjs-chat', 
    {email: session.user.email, image: session.user.image, author: session.user.name, isTyping: false}, 
    function(err) {   
      if (err) {
        console.log('error: ', err);  
      }
    });

    channel.presence.subscribe('enter', function(member) {
      setMembers((members)=> {
        members.push(member.data.image);
        members = Array.from(new Set(members));
        return [...members]
      });
    });

    channel.presence.get(function(err, members) {
      if (err) {
        console.log('error: ', err);  
      } else {
        setMembers(members.map((member) => member.data.image));
      }
    });
    if (!session) { channel.presence.enterClient('ably-nextjs-chat', 
        {email: session.user.email, image: session.user.image, author: session.user.name, isTyping: false}, 
        function(err) {   
          if (err) {
            console.log('error: ', err);  
          }
        });
      }
  
    setMessagesFromDB(async() => await queryWithPartiQL());
    setPrivateChannels(async() => await queryChannelsWithPartiQL());
  }, [session]);

  var parsedMessages = [];
  if (messagesFromDB?.length && session && status === 'authenticated') {
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
                  <span className={styles.authorMe}>{author}<br/></span>
                  <span className={styles.parsedMsgMe}>{parsedMessage}</span>
                </span>     
              </>
              :
              <>
                <span className={styles.message} data-author={author}> 
                  <span id="other" className={styles.author}>{author}<br/></span>
                  <span className={styles.parsedMsg}>{parsedMessage}</span>
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
        data: `<strong>${messageText.slice(3, -4) + '</strong>' + '<em id="date">at '+ new Date().toLocaleString().split(',')[1]}</em>` 
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

  const createChannel = async () => {
    if (value === '') {
      alert("Please enter a channel name")
      return;
    }
    let channelExists = false;
    const statement = 'SELECT * FROM "ably_channels"';
    await dynamodb.executeStatement({Statement: statement}).promise().then((data) => {
     data.Items.forEach((item) => {
        if (item.channelName.S === value.toLowerCase()) {
          alert("This channel name is already taken by another user")
          setValue("");
          channelExists = true;
          return;
        }
      })
      if (channelExists) {
        return;
      }
      if (privateChannels.includes(value.toLowerCase())) {
      alert("This channel already exists")
      setValue("");
      } else {
        setChannelName(value.toLowerCase());
        const newChannel = realtime.channels.get(value.toLowerCase());
        newChannel.attach();
        newChannel.publish({ 
          name: value.toLowerCase(), 
          data: `A New Channel named <strong>"${value.toLowerCase()}"</strong> was created <em id="date"> at ${new Date().toLocaleString().split(',')[1]}</em>` 
        });
        newChannel.once("attached", () => {
          newChannel.history((err, page) => {
            setMessagesFromDB((messagesFromDB)=>{
              if (Array.isArray(messagesFromDB)) {
                return [...messagesFromDB, ...page.items.reverse()]
              } else {
                return [...page.items.reverse()]
              }
              
            });
            setPrivateChannels((privateChannels)=> {
              Array.isArray(privateChannels) ? 
              [...privateChannels, value.toLowerCase()]
              : 
              [value.toLowerCase()]
              });
            saveChannelToDB(value.toLowerCase());
            
          });
          setTimeout(() => { setMessagesFromDB(queryWithPartiQL()); }, 50);
          setTimeout((privateChannels) => {
            Array.isArray(privateChannels) ?
            [...privateChannels, value.toLowerCase()]
            : 
            [value.toLowerCase()]
          }) }, 100);
          setValue("");
      }
    }).catch((error) => {
      console.log('error: ', error);  
    }
    );
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
    const newChannel = realtime.channels.get(newChannelName);
    newChannel.attach();
    newChannel.publish({ 
      name: newChannelName, 
      data: `Switched to channel: <strong>"${newChannelName}"</strong> <em id="date">at ${new Date().toLocaleString().split(',')[1]}</em>` 
    });
      newChannel.history((err, page) => {
        let messages = page.items.reverse();
        setMessagesFromDB((messagesFromDB)=>{
          if (Array.isArray(messagesFromDB)) {
            return [...messagesFromDB, ...messages]
          }
        });
      });
    }
  }

  useEffect(() => {
    messageEnd.scrollIntoView({ behaviour: "smooth" });
  });

  return (
    <>
      <h1 className={styles.channels}>
      <span className={styles.channelTitle}>PUBLIC</span>
      {channels.map((channel, index) => 
      <span key={index}>
        <p className={styles.channelListItems} onClick={(e) => switchChannel(e)}>
        <span key={index} className={styles.hashTag}>#</span>
          {channel}
        </p>
      </span>
      )}
      <br/>
      <div className={styles.createChannel}>
          <input 
          className={styles.createChannelInput}
          id="create-channel" 
          type="text" 
          placeholder="Enter Private Name"
          maxLength={14}
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
          <button className={styles.newChannelButton} onClick={createChannel}>Create Channel</button>
        </div>
      <span className={styles.channelTitle}>PRIVATE</span>
      {Array.isArray(privateChannels) ? privateChannels.map((channel, index) => 
      <span key={index}>
        <p className={styles.channelListItems} onClick={(e) => switchChannel(e)}>
        <span key={index} className={styles.hashTag}>#</span>
          {channel}
        </p>
      </span>
      ): <span> &nbsp;NO</span>}
      </h1>
      <center className={styles.chatCenter}>
        <div>
          <p>Users Online</p>
          { Array.from(new Set(members)).map((member, index) => {
            return <img src={member} key={index} height={30} style={{ borderRadius: "25px" }}  /> 
          })}
        </div>
        <h1 className={styles.channelHeading}>"{channelName}"</h1>
        <div className={styles.typeIndicator}>
          {messageText !== '' ? (
          <>
            <div>
              { membersTyping.length < 3 ? membersTyping.map((member, index) => member.isTyping ? <span key={index}>{member.author}&nbsp;{index === 0 && membersTyping.length > 1 ? <span>&</span> : null} </span> : null) :  
              <span>{ membersTyping[0].author }&nbsp;<span>&</span>&nbsp;{ membersTyping[1].author }</span>
              }  
            </div>
            <img src="https://www.slicktext.com/images/common/typing-indicator-loader.gif" height={20}/> 
          </>
          )
          : null}
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
              onEditorChange={(content, editor) => {
                getPresenceTyping(content);
                typingIndicator(content);
                return setMessageText(content)
              }}
            />
            <button type="submit" className={styles.button}>Send</button>
          </form>
        </div>
      </center>
    </>
  )
}

export default AblyChatComponent;