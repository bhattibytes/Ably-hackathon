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
  const [allPrivateChannelInfo, setallPrivateChannelInfo] = useState([{}]);
  const [privateMessages, setPrivateMessages] = useState([]);
  const [directMessagesFromDB, setDirectMessagesFromDB] = useState([]);
  const { data: session, status } = useSession();
  const [messagesFromDB, setMessagesFromDB] = useState([]);
  const [members, setMembers] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]); 
  const [membersTyping, setMembersTyping] = useState([]);

  async function queryUsersWithPartiQL() {
    const statement = 'SELECT * FROM "ably_users"';
    return await dynamodb.executeStatement({Statement: statement}).promise().then((data) => {
      if (data.Items.length) {
        setMessagesFromDB(data.Items);
      }
    }).catch((error) => {
      console.log('error: ', error);  
    });;
  }

  async function queryDirectMsgsWithPartiQL() {
    const statement = 'SELECT * FROM "ably_direct_messages"';
    return await dynamodb.executeStatement({Statement: statement}).promise().then((data) => {
      if (data.Items.length) {
        setDirectMessagesFromDB(data.Items);
      }
    }).catch((error) => {
      console.log('error: ', error);  
    });;
  }

  async function queryChannelsWithPartiQL() {
    const statement = 'SELECT * FROM "ably_channels"';
    return await dynamodb.executeStatement({Statement: statement}).promise().then((data) => {
      setallPrivateChannelInfo(data.Items);
      if (data.Items.length) {
        let channelsFromDB = [];
        data.Items.forEach((item) => {
          if (item.channelMembers.SS.includes(session.user.name)) {
            channelsFromDB.push(item.channelName.S);
          }
        });
        setPrivateChannels([...channelsFromDB]);
      }
    }).catch((error) => {
      console.log('error: ', error);  
    });;
  }

  const addRegisteredUsers = async () => {
    const statement = 'SELECT * FROM "ably_registered"';
    return await dynamodb.executeStatement({Statement: statement}).promise().then((data) => {
      if (data.Items.length) {
        let usersFromDB = [];
        data.Items[0].userNames.SS.forEach((item, index) => {
          usersFromDB.push({name: item, email: data.Items[0].userEmails.SS[index], image: data.Items[0].userImages.SS[index]});
        });
        setRegisteredUsers([...usersFromDB]);
      }
    }).catch((error) => {
      console.log('error: ', error);  
    });
  }

  const [channel, realtime] = useChannel(channelName, async (message) => {
    let messagesFromDBCall = [];
    setTimeout(async() => { messagesFromDBCall = await queryUsersWithPartiQL(); }, 10);
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

 

  const saveUserToDB = () => {
    registeredUsers.forEach((user) => {
      if (user.email === session.user.email) {
        return;
      } else {
        dynamodb.updateItem({
          TableName: 'ably_registered',
          Key: {
            'id': { S: '1' },
          },
          UpdateExpression: 'ADD userEmails :userEmails, userNames :userNames, userImages :userImages',
          ExpressionAttributeValues: {
            ':userEmails': { SS: [session.user.email] },
            ':userNames': { SS: [session.user.name] },
            ':userImages': { SS: [session.user.image] },
          },
          ReturnValues: 'ALL_NEW',
        }, function(err, data) {
          if (err) {
            console.log('Error', err);
          } else {
            console.log('Success MSG: ', data);
          }
        });
      }
    })
  }

  const saveDirectMessageToDB = async (messageText) => {
    dynamodb.putItem({
      TableName: 'ably_direct_messages',
      Item: {
        'id': { S: uuidv4() },
        'email': { S: session.user.email },
        'name': { S: session.user.name },
        'image': { S: session.user.image },
        'timestamp': { S: new Date().toISOString() },
        'connectionId': { S: realtime.connection.id },
        'message': { S: messageText },
        'channel': { S: channelName },
        'members': { SS: [session.user.name] },
      }
    }, function(err, data) {
      if (err) {
        console.log('Error', err);
      } else {
        console.log('Success MSG: ', data);
      }
    });
  }


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
        'channelMembersImg': { SS: [session.user.image] },
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
          members = Array.from(new Set(members));
          setMembersTyping(members.filter((member) => member.data.isTyping === true).map((member) => member.data));
        }
      });
      channel.presence.subscribe('enter', function(member) {
        setMembers((members)=> {
          members.push(member.data);
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

  const getPresenceTyping = async (content) => {
    return new Promise((resolve, reject) => {
    if (content !== '') {
      channel.presence.get(function(err, members) {
      if (err) {
        console.log('error: ', err);  
      } else {
        members = members.filter((member) => member.data.isTyping)
        members = Array.from(new Set(members));
        setMembersTyping(members);
      }
    });
    } else {
      channel.presence.leaveClient('ably-nextjs-chat', {email: session.user.email, image: session.user.image, author: session.user.name, isTyping: false}, function(err) {   
        if (err) {
          console.log('error: ', err);  
        }
      });
    }
    resolve();
    }).catch((error) => {
      console.log('error: ', error);  
      reject(error);
    });
  }
  useEffect(() => {
    channel.presence.enterClient('ably-nextjs-chat', 
    {email: session?.user.email, image: session?.user.image, author: session?.user.name, isTyping: false}, 
    function(err) {   
      if (err) {
        console.log('error: ', err);  
      }
    });

    channel.presence.subscribe('enter', function(member) {
      setMembers((members)=> {
        members.push(member.data);
        members = Array.from(new Set(members));
        return [...members]
      });
    });

    channel.presence.get(function(err, members) {
      if (err) {
        console.log('error: ', err);  
      } else {
        setMembers(members.map((member) => member.data));
      }
    });
    if (!session) { channel.presence.enterClient('ably-nextjs-chat', 
        {email: session?.user.email, image: session?.user.image, author: session?.user.name, isTyping: false}, 
        function(err) {   
          if (err) {
            console.log('error: ', err);  
          }
        });
      }
  
    setMessagesFromDB(async() => await queryUsersWithPartiQL());
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
          <span key={`${index}=Messages`} className={styles.messages}>
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
  const overlay = document.querySelector('div#overlay');

  const sendChatMessage = async (messageText) => {
    if (messageText !== '') {
      await channel.publish({ 
        name: channelName, 
        data: `<strong>${messageText.slice(3, -4) + '</strong>' + '<em id="date">at '+ new Date().toLocaleString().split(',')[1]}</em>` 
      });
      setTimeout(() => { setMessagesFromDB(queryUsersWithPartiQL()); }, 50);
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
              if (Array.isArray(privateChannels)) {
                return [...privateChannels, value.toLowerCase()]
              } else { 
                return [value.toLowerCase()]
              }
              });
            saveChannelToDB(value.toLowerCase());
            
          });
          setTimeout(() => { setMessagesFromDB(queryUsersWithPartiQL()); }, 50);
          setTimeout((privateChannels) => {
            if (Array.isArray(privateChannels)) {
              return [...privateChannels, value.toLowerCase()]
            } else { 
              return [value.toLowerCase()]
            }
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

  const getUniqueMembers = (code) => {
    if (code === 1) {
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          if (members[i].author === members[j].author) {
            members.splice(j, 1);
          }
        }
      }
      return members.map((member, i) => {
        return (
          <div className={styles.onlineUsersList} key={`${i}=MemberList`}>
            <img src={member.image} width={40} style={{ borderRadius: "25px" }} onClick={sendPrivateMessage} id={member.author}/> 
            <span className={styles.onlineName}>{member.author}
            { membersTyping.map((memberType, index) => {
              if (memberType.author === member.author && memberType.isTyping === true && messageText !== '' ) {
              return (
                <img className={styles.typing} id="typing-indicator" src="https://www.slicktext.com/images/common/typing-indicator-loader.gif"/>
              )
            } else {
              return null;
            }
            })}
            </span>
          </div>
        )
      })
    }
    if (code === 2) {
      return registeredUsers.map((member, i) => {
        console.log(member);
        return (
          <div key={`${i}=MemberInvite`} className={styles.overlayMem}>
            <img src={member.image} width={60} style={{ borderRadius: "40px" }} id={member.name}/>
            <button className={styles.inviteBtn} onClick={() => handleInviteUserToChannel(member.name, member.image)}>Invite</button> 
          </div>
        )
      })
    }

    if (code === 3) {
      return allPrivateChannelInfo.filter((member, i) => { 
      if (member.channelName?.S === channelName && member.channelMembersImg?.SS) {
        return (member);
      }
    })
    }
  }

  const sendPrivateMessage = (e) => {
    if (e.target.id === session.user.name) {
      alert("You cannot send a private message to yourself")
      return;
    }
    if (privateMessages.includes(e.target.id)) {
      alert("You are already in a private chat with this user")
      return;
    }

    setChannelName(e.target.id);

    const newChannel = realtime.channels.get(e.target.id);
        newChannel.attach();
        newChannel.publish({ 
          name: e.target.id, 
          data: `A New Private Message chat with <strong>"${e.target.id}"</strong> was created <em id="date"> at ${new Date().toLocaleString().split(',')[1]}</em>` 
        });
    setPrivateMessages((privateMessages)=> {
      if (Array.isArray(privateMessages)) {
        return [...privateMessages, e.target.id]
      } else {
        return [e.target.id]
      }
    });
  }

  const handleOpenOverlay = () => {
    overlay.style.display = "flex";
  }

  const handleClose = () => {
    overlay.style.display = 'none';
  }

  const handleInviteUserToChannel = (name, img) => {
    const channelToChange = allPrivateChannelInfo.filter((channel) => channel.channelName.S === channelName).map((channel) => {
      return channel.id.S;
    });
    dynamodb.updateItem({
      TableName: 'ably_channels',
      Key: {
        'id': { S: channelToChange[0] },
      },
      UpdateExpression: 'ADD channelMembers :channelMembers, channelMembersImg :channelMembersImg',
      ExpressionAttributeValues: {
        ':channelMembers': { SS: [name] },
        ':channelMembersImg': { SS: [img] },
      },
      ReturnValues: 'ALL_NEW',
    }, function(err, data) {
      if (err) {
        console.log('Error', err);
      } else {
        console.log('Success MSG: ', data);
      }
    });
    overlay.style.display = "none";
  }

  useEffect( () => {
    addRegisteredUsers();
    saveUserToDB();
    // queryDirectMsgsWithPartiQL();
  }, []);

  useEffect(() => {
    messageEnd.scrollIntoView({ behaviour: "smooth" });
  });

  return (
    <>
      <div className={styles.mainContainer}>
      <div className={styles.privateChannelsUserListContainer}>  
          {getUniqueMembers(3).map((member, i) => {
            return member.channelMembersImg.SS.map((memberImg) => {
            return (
              <div key={`${uuidv4()}=PrivateMember+${i}`} className={styles.privateChannelsUserList}>
                <img src={memberImg} width={40} height={40} className={styles.channelMemberImg} />
              </div>
            )});
          })}
        </div>
        <h1 className={styles.channelHeading}>"{channelName}"{Array.isArray(privateChannels) && privateChannels.includes(channelName) ? <span className={styles.plusBtn} onClick={handleOpenOverlay}>👤+</span> 
        : null}
        </h1>
        <div id="overlay" className={styles.overlay}><div>{getUniqueMembers(2)}</div><button onClick={handleClose}>X</button></div>
      <div className={styles.channelsContainer}>
      <div className={styles.channels}>
      <span className={styles.channelTitle}>PUBLIC</span>
      {channels.map((channel, index) => 
      <span key={`${index}=Public`}>
        <p className={styles.channelListItems} onClick={(e) => switchChannel(e)}>
        <span className={styles.hashTag}>#</span>
          {channel}
        </p>
      </span>
      )}
      <br/>
      <hr width={140} style={{ marginBottom: "10px" }}/>
      <div className={styles.createChannel}>
          <input 
          className={styles.createChannelInput}
          id="create-channel" 
          type="text" 
          placeholder="Type Private Name"
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
        <hr width={140}/>
      <span className={styles.channelTitle}>PRIVATE</span>
      {Array.isArray(privateChannels) ? privateChannels.map((channel, index) => 
      <span key={`${index}=Private`}>
        <p className={styles.channelListItems} onClick={(e) => switchChannel(e)}>
        <span className={styles.hashTag}>#</span>
          {channel}
        </p>
      </span>
      ): <span></span>}
      <br/>
      {/* <span className={styles.channelTitle}>MESSAGES</span> */}
      <div className={styles.chatUserContainer}>
        <p className={styles.chatTitle}>DM Online Members</p>
        <div className={styles.chatUser}>{ getUniqueMembers(1) }</div>
      </div>
      {Array.isArray(privateMessages) && privateMessages.length ? privateMessages.map((pMsg, index) => 
      <span key={`${index}=PrivMessages`}>
        <p className={styles.channelListItems} onClick={(e) => switchChannel(e)}>
        <span className={styles.hashTag}>#</span>
          {pMsg}
        </p>
      </span>
      ): null}
      </div>
      </div>
      <center className={styles.chatCenter}>
        <div className={styles.chatHolder}>
          <div className={styles.chatText}>
            {parsedMessages}
            <div ref={(element) => { messageEnd = element; }}></div> 
          </div>
        </div>
      </center>
     
      <center className={styles.editorContainer}>
        <div className={styles.editor}>
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
                      height: 200,
                      placeholder: "Type your message here...",
                      menubar: false,
                      resize: false,
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
                      return (
                      getPresenceTyping(content),
                      typingIndicator(content),
                      setMessageText(content)
                      )
                    }}
                  />
                  <button type="submit" className={styles.button}>Send</button>
            </form>
            </div>
          </center>
        </div>
    </>
  )
}

export default AblyChatComponent;